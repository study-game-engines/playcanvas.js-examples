/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { Mat4 } from '../../core/math/mat4.js';
import { Vec3 } from '../../core/math/vec3.js';
import { BoundingBox } from '../../core/shape/bounding-box.js';
import { SEMANTIC_COLOR, INDEXFORMAT_UINT32, INDEXFORMAT_UINT16, PRIMITIVE_POINTS, PRIMITIVE_LINES, PRIMITIVE_LINELOOP, PRIMITIVE_LINESTRIP, PRIMITIVE_TRIANGLES, PRIMITIVE_TRISTRIP, PRIMITIVE_TRIFAN, TYPE_INT8, TYPE_UINT8, TYPE_INT16, TYPE_UINT16, TYPE_INT32, TYPE_UINT32, TYPE_FLOAT32, SEMANTIC_POSITION, SEMANTIC_NORMAL, SEMANTIC_TANGENT, SEMANTIC_BLENDWEIGHT, SEMANTIC_BLENDINDICES, SEMANTIC_TEXCOORD0, SEMANTIC_TEXCOORD1, SEMANTIC_TEXCOORD2, SEMANTIC_TEXCOORD3, SEMANTIC_TEXCOORD4, SEMANTIC_TEXCOORD5, SEMANTIC_TEXCOORD6, SEMANTIC_TEXCOORD7 } from '../../platform/graphics/constants.js';
import { IndexBuffer } from '../../platform/graphics/index-buffer.js';
import { VertexBuffer } from '../../platform/graphics/vertex-buffer.js';
import { VertexFormat } from '../../platform/graphics/vertex-format.js';
import { VertexIterator } from '../../platform/graphics/vertex-iterator.js';
import { partitionSkin } from '../../scene/skin-partition.js';
import { GraphNode } from '../../scene/graph-node.js';
import { Mesh } from '../../scene/mesh.js';
import { MeshInstance } from '../../scene/mesh-instance.js';
import { Model } from '../../scene/model.js';
import { Morph } from '../../scene/morph.js';
import { MorphInstance } from '../../scene/morph-instance.js';
import { MorphTarget } from '../../scene/morph-target.js';
import { Skin } from '../../scene/skin.js';
import { SkinInstance } from '../../scene/skin-instance.js';

const JSON_PRIMITIVE_TYPE = {
  'points': PRIMITIVE_POINTS,
  'lines': PRIMITIVE_LINES,
  'lineloop': PRIMITIVE_LINELOOP,
  'linestrip': PRIMITIVE_LINESTRIP,
  'triangles': PRIMITIVE_TRIANGLES,
  'trianglestrip': PRIMITIVE_TRISTRIP,
  'trianglefan': PRIMITIVE_TRIFAN
};
const JSON_VERTEX_ELEMENT_TYPE = {
  'int8': TYPE_INT8,
  'uint8': TYPE_UINT8,
  'int16': TYPE_INT16,
  'uint16': TYPE_UINT16,
  'int32': TYPE_INT32,
  'uint32': TYPE_UINT32,
  'float32': TYPE_FLOAT32
};

// Take PlayCanvas JSON model data and create pc.Model
class JsonModelParser {
  constructor(device, defaultMaterial) {
    this._device = device;
    this._defaultMaterial = defaultMaterial;
  }
  parse(data, callback) {
    const modelData = data.model;
    if (!modelData) {
      callback(null, null);
      return;
    }
    if (modelData.version <= 1) {
      callback('JsonModelParser#parse: Trying to parse unsupported model format.');
      return;
    }

    // NODE HIERARCHY
    const nodes = this._parseNodes(data);

    // SKINS
    const skins = this._parseSkins(data, nodes);

    // VERTEX BUFFERS
    const vertexBuffers = this._parseVertexBuffers(data);

    // INDEX BUFFER
    const indices = this._parseIndexBuffers(data, vertexBuffers);

    // MORPHS
    const morphs = this._parseMorphs(data, nodes, vertexBuffers);

    // MESHES
    const meshes = this._parseMeshes(data, skins.skins, morphs.morphs, vertexBuffers, indices.buffer, indices.data);

    // MESH INSTANCES
    const meshInstances = this._parseMeshInstances(data, nodes, meshes, skins.skins, skins.instances, morphs.morphs, morphs.instances);
    const model = new Model();
    model.graph = nodes[0];
    model.meshInstances = meshInstances;
    model.skinInstances = skins.instances;
    model.morphInstances = morphs.instances;
    model.getGraph().syncHierarchy();
    callback(null, model);
  }
  _parseNodes(data) {
    const modelData = data.model;
    const nodes = [];
    let i;
    for (i = 0; i < modelData.nodes.length; i++) {
      const nodeData = modelData.nodes[i];
      const node = new GraphNode(nodeData.name);
      node.setLocalPosition(nodeData.position[0], nodeData.position[1], nodeData.position[2]);
      node.setLocalEulerAngles(nodeData.rotation[0], nodeData.rotation[1], nodeData.rotation[2]);
      node.setLocalScale(nodeData.scale[0], nodeData.scale[1], nodeData.scale[2]);
      node.scaleCompensation = !!nodeData.scaleCompensation;
      nodes.push(node);
    }
    for (i = 1; i < modelData.parents.length; i++) {
      nodes[modelData.parents[i]].addChild(nodes[i]);
    }
    return nodes;
  }
  _parseSkins(data, nodes) {
    const modelData = data.model;
    const skins = [];
    const skinInstances = [];
    let i, j;
    if (!this._device.supportsBoneTextures && modelData.skins.length > 0) {
      const boneLimit = this._device.getBoneLimit();
      partitionSkin(modelData, null, boneLimit);
    }
    for (i = 0; i < modelData.skins.length; i++) {
      const skinData = modelData.skins[i];
      const inverseBindMatrices = [];
      for (j = 0; j < skinData.inverseBindMatrices.length; j++) {
        const ibm = skinData.inverseBindMatrices[j];
        inverseBindMatrices[j] = new Mat4().set(ibm);
      }
      const skin = new Skin(this._device, inverseBindMatrices, skinData.boneNames);
      skins.push(skin);
      const skinInstance = new SkinInstance(skin);
      // Resolve bone IDs to actual graph nodes
      const bones = [];
      for (j = 0; j < skin.boneNames.length; j++) {
        const boneName = skin.boneNames[j];
        const bone = nodes[0].findByName(boneName);
        bones.push(bone);
      }
      skinInstance.bones = bones;
      skinInstances.push(skinInstance);
    }
    return {
      skins: skins,
      instances: skinInstances
    };
  }

  // find number of vertices used by a mesh that is using morph target with index morphIndex
  _getMorphVertexCount(modelData, morphIndex, vertexBuffers) {
    for (let i = 0; i < modelData.meshes.length; i++) {
      const meshData = modelData.meshes[i];
      if (meshData.morph === morphIndex) {
        const vertexBuffer = vertexBuffers[meshData.vertices];
        return vertexBuffer.numVertices;
      }
    }
    return undefined;
  }
  _parseMorphs(data, nodes, vertexBuffers) {
    const modelData = data.model;
    const morphs = [];
    const morphInstances = [];
    let i, j, vertexCount;
    let targets, morphTarget, morphTargetArray;
    if (modelData.morphs) {
      // convert sparse morph target vertex data to full format
      const sparseToFull = function sparseToFull(data, indices, totalCount) {
        const full = new Float32Array(totalCount * 3);
        for (let s = 0; s < indices.length; s++) {
          const dstIndex = indices[s] * 3;
          full[dstIndex] = data[s * 3];
          full[dstIndex + 1] = data[s * 3 + 1];
          full[dstIndex + 2] = data[s * 3 + 2];
        }
        return full;
      };
      for (i = 0; i < modelData.morphs.length; i++) {
        targets = modelData.morphs[i].targets;
        morphTargetArray = [];

        // total number of verticies of the mesh
        vertexCount = this._getMorphVertexCount(modelData, i, vertexBuffers);
        for (j = 0; j < targets.length; j++) {
          const targetAabb = targets[j].aabb;
          const min = targetAabb.min;
          const max = targetAabb.max;
          const aabb = new BoundingBox(new Vec3((max[0] + min[0]) * 0.5, (max[1] + min[1]) * 0.5, (max[2] + min[2]) * 0.5), new Vec3((max[0] - min[0]) * 0.5, (max[1] - min[1]) * 0.5, (max[2] - min[2]) * 0.5));

          // convert sparse to full format
          const indices = targets[j].indices;
          let deltaPositions = targets[j].deltaPositions;
          let deltaNormals = targets[j].deltaNormals;
          if (indices) {
            deltaPositions = sparseToFull(deltaPositions, indices, vertexCount);
            deltaNormals = sparseToFull(deltaNormals, indices, vertexCount);
          }
          morphTarget = new MorphTarget({
            deltaPositions: deltaPositions,
            deltaNormals: deltaNormals,
            name: targets[j].name,
            aabb: aabb
          });
          morphTargetArray.push(morphTarget);
        }
        const morph = new Morph(morphTargetArray, this._device);
        morphs.push(morph);
        const morphInstance = new MorphInstance(morph);
        morphInstances.push(morphInstance);
      }
    }
    return {
      morphs: morphs,
      instances: morphInstances
    };
  }
  _parseVertexBuffers(data) {
    const modelData = data.model;
    const vertexBuffers = [];
    const attributeMap = {
      position: SEMANTIC_POSITION,
      normal: SEMANTIC_NORMAL,
      tangent: SEMANTIC_TANGENT,
      blendWeight: SEMANTIC_BLENDWEIGHT,
      blendIndices: SEMANTIC_BLENDINDICES,
      color: SEMANTIC_COLOR,
      texCoord0: SEMANTIC_TEXCOORD0,
      texCoord1: SEMANTIC_TEXCOORD1,
      texCoord2: SEMANTIC_TEXCOORD2,
      texCoord3: SEMANTIC_TEXCOORD3,
      texCoord4: SEMANTIC_TEXCOORD4,
      texCoord5: SEMANTIC_TEXCOORD5,
      texCoord6: SEMANTIC_TEXCOORD6,
      texCoord7: SEMANTIC_TEXCOORD7
    };
    for (let i = 0; i < modelData.vertices.length; i++) {
      const vertexData = modelData.vertices[i];
      const formatDesc = [];
      for (const attributeName in vertexData) {
        const attribute = vertexData[attributeName];
        formatDesc.push({
          semantic: attributeMap[attributeName],
          components: attribute.components,
          type: JSON_VERTEX_ELEMENT_TYPE[attribute.type],
          normalize: attributeMap[attributeName] === SEMANTIC_COLOR
        });
      }
      const vertexFormat = new VertexFormat(this._device, formatDesc);

      // Create the vertex buffer
      const numVertices = vertexData.position.data.length / vertexData.position.components;
      const vertexBuffer = new VertexBuffer(this._device, vertexFormat, numVertices);
      const iterator = new VertexIterator(vertexBuffer);
      for (let j = 0; j < numVertices; j++) {
        for (const attributeName in vertexData) {
          const attribute = vertexData[attributeName];
          switch (attribute.components) {
            case 1:
              iterator.element[attributeMap[attributeName]].set(attribute.data[j]);
              break;
            case 2:
              iterator.element[attributeMap[attributeName]].set(attribute.data[j * 2], 1.0 - attribute.data[j * 2 + 1]);
              break;
            case 3:
              iterator.element[attributeMap[attributeName]].set(attribute.data[j * 3], attribute.data[j * 3 + 1], attribute.data[j * 3 + 2]);
              break;
            case 4:
              iterator.element[attributeMap[attributeName]].set(attribute.data[j * 4], attribute.data[j * 4 + 1], attribute.data[j * 4 + 2], attribute.data[j * 4 + 3]);
              break;
          }
        }
        iterator.next();
      }
      iterator.end();
      vertexBuffers.push(vertexBuffer);
    }
    return vertexBuffers;
  }
  _parseIndexBuffers(data, vertexBuffers) {
    const modelData = data.model;
    let indexBuffer = null;
    let indexData = null;
    let i;

    // Count the number of indices in the model
    let numIndices = 0;
    for (i = 0; i < modelData.meshes.length; i++) {
      const meshData = modelData.meshes[i];
      if (meshData.indices !== undefined) {
        numIndices += meshData.indices.length;
      }
    }

    // Create an index buffer big enough to store all indices in the model
    let maxVerts = 0;
    for (i = 0; i < vertexBuffers.length; i++) {
      maxVerts = Math.max(maxVerts, vertexBuffers[i].numVertices);
    }
    if (numIndices > 0) {
      if (maxVerts > 0xFFFF && this._device.extUintElement) {
        indexBuffer = new IndexBuffer(this._device, INDEXFORMAT_UINT32, numIndices);
        indexData = new Uint32Array(indexBuffer.lock());
      } else {
        indexBuffer = new IndexBuffer(this._device, INDEXFORMAT_UINT16, numIndices);
        indexData = new Uint16Array(indexBuffer.lock());
      }
    }
    return {
      buffer: indexBuffer,
      data: indexData
    };
  }
  _parseMeshes(data, skins, morphs, vertexBuffers, indexBuffer, indexData) {
    const modelData = data.model;
    const meshes = [];
    let indexBase = 0;
    for (let i = 0; i < modelData.meshes.length; i++) {
      const meshData = modelData.meshes[i];
      const meshAabb = meshData.aabb;
      const min = meshAabb.min;
      const max = meshAabb.max;
      const aabb = new BoundingBox(new Vec3((max[0] + min[0]) * 0.5, (max[1] + min[1]) * 0.5, (max[2] + min[2]) * 0.5), new Vec3((max[0] - min[0]) * 0.5, (max[1] - min[1]) * 0.5, (max[2] - min[2]) * 0.5));
      const indexed = meshData.indices !== undefined;
      const mesh = new Mesh(this._device);
      mesh.vertexBuffer = vertexBuffers[meshData.vertices];
      mesh.indexBuffer[0] = indexed ? indexBuffer : null;
      mesh.primitive[0].type = JSON_PRIMITIVE_TYPE[meshData.type];
      mesh.primitive[0].base = indexed ? meshData.base + indexBase : meshData.base;
      mesh.primitive[0].count = meshData.count;
      mesh.primitive[0].indexed = indexed;
      mesh.skin = meshData.skin !== undefined ? skins[meshData.skin] : null;
      mesh.morph = meshData.morph !== undefined ? morphs[meshData.morph] : null;
      mesh.aabb = aabb;
      if (indexed) {
        // Create the index buffer
        indexData.set(meshData.indices, indexBase);
        indexBase += meshData.indices.length;
      }
      meshes.push(mesh);
    }
    if (indexBuffer !== null) {
      indexBuffer.unlock();
    }
    return meshes;
  }
  _parseMeshInstances(data, nodes, meshes, skins, skinInstances, morphs, morphInstances) {
    const modelData = data.model;
    const meshInstances = [];
    let i;
    for (i = 0; i < modelData.meshInstances.length; i++) {
      const meshInstanceData = modelData.meshInstances[i];
      const node = nodes[meshInstanceData.node];
      const mesh = meshes[meshInstanceData.mesh];
      const meshInstance = new MeshInstance(mesh, this._defaultMaterial, node);
      if (mesh.skin) {
        const skinIndex = skins.indexOf(mesh.skin);
        if (skinIndex === -1) {
          throw new Error('Mesh\'s skin does not appear in skin array.');
        }
        meshInstance.skinInstance = skinInstances[skinIndex];
      }
      if (mesh.morph) {
        const morphIndex = morphs.indexOf(mesh.morph);
        if (morphIndex === -1) {
          throw new Error('Mesh\'s morph does not appear in morph array.');
        }
        meshInstance.morphInstance = morphInstances[morphIndex];
      }
      meshInstances.push(meshInstance);
    }
    return meshInstances;
  }
}

export { JsonModelParser };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1tb2RlbC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2ZyYW1ld29yay9wYXJzZXJzL2pzb24tbW9kZWwuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWF0NCB9IGZyb20gJy4uLy4uL2NvcmUvbWF0aC9tYXQ0LmpzJztcbmltcG9ydCB7IFZlYzMgfSBmcm9tICcuLi8uLi9jb3JlL21hdGgvdmVjMy5qcyc7XG5cbmltcG9ydCB7IEJvdW5kaW5nQm94IH0gZnJvbSAnLi4vLi4vY29yZS9zaGFwZS9ib3VuZGluZy1ib3guanMnO1xuXG5pbXBvcnQge1xuICAgIElOREVYRk9STUFUX1VJTlQxNiwgSU5ERVhGT1JNQVRfVUlOVDMyLFxuICAgIFBSSU1JVElWRV9MSU5FTE9PUCwgUFJJTUlUSVZFX0xJTkVTVFJJUCwgUFJJTUlUSVZFX0xJTkVTLCBQUklNSVRJVkVfUE9JTlRTLCBQUklNSVRJVkVfVFJJQU5HTEVTLCBQUklNSVRJVkVfVFJJRkFOLCBQUklNSVRJVkVfVFJJU1RSSVAsXG4gICAgU0VNQU5USUNfUE9TSVRJT04sIFNFTUFOVElDX05PUk1BTCwgU0VNQU5USUNfVEFOR0VOVCwgU0VNQU5USUNfQ09MT1IsIFNFTUFOVElDX0JMRU5ESU5ESUNFUywgU0VNQU5USUNfQkxFTkRXRUlHSFQsIFNFTUFOVElDX1RFWENPT1JEMCwgU0VNQU5USUNfVEVYQ09PUkQxLFxuICAgIFNFTUFOVElDX1RFWENPT1JEMiwgU0VNQU5USUNfVEVYQ09PUkQzLCBTRU1BTlRJQ19URVhDT09SRDQsIFNFTUFOVElDX1RFWENPT1JENSwgU0VNQU5USUNfVEVYQ09PUkQ2LCBTRU1BTlRJQ19URVhDT09SRDcsXG4gICAgVFlQRV9JTlQ4LCBUWVBFX1VJTlQ4LCBUWVBFX0lOVDE2LCBUWVBFX1VJTlQxNiwgVFlQRV9JTlQzMiwgVFlQRV9VSU5UMzIsIFRZUEVfRkxPQVQzMlxufSBmcm9tICcuLi8uLi9wbGF0Zm9ybS9ncmFwaGljcy9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgSW5kZXhCdWZmZXIgfSBmcm9tICcuLi8uLi9wbGF0Zm9ybS9ncmFwaGljcy9pbmRleC1idWZmZXIuanMnO1xuaW1wb3J0IHsgVmVydGV4QnVmZmVyIH0gZnJvbSAnLi4vLi4vcGxhdGZvcm0vZ3JhcGhpY3MvdmVydGV4LWJ1ZmZlci5qcyc7XG5pbXBvcnQgeyBWZXJ0ZXhGb3JtYXQgfSBmcm9tICcuLi8uLi9wbGF0Zm9ybS9ncmFwaGljcy92ZXJ0ZXgtZm9ybWF0LmpzJztcbmltcG9ydCB7IFZlcnRleEl0ZXJhdG9yIH0gZnJvbSAnLi4vLi4vcGxhdGZvcm0vZ3JhcGhpY3MvdmVydGV4LWl0ZXJhdG9yLmpzJztcblxuaW1wb3J0IHsgcGFydGl0aW9uU2tpbiB9IGZyb20gJy4uLy4uL3NjZW5lL3NraW4tcGFydGl0aW9uLmpzJztcbmltcG9ydCB7IEdyYXBoTm9kZSB9IGZyb20gJy4uLy4uL3NjZW5lL2dyYXBoLW5vZGUuanMnO1xuaW1wb3J0IHsgTWVzaCB9IGZyb20gJy4uLy4uL3NjZW5lL21lc2guanMnO1xuaW1wb3J0IHsgTWVzaEluc3RhbmNlIH0gZnJvbSAnLi4vLi4vc2NlbmUvbWVzaC1pbnN0YW5jZS5qcyc7XG5pbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4uLy4uL3NjZW5lL21vZGVsLmpzJztcbmltcG9ydCB7IE1vcnBoIH0gZnJvbSAnLi4vLi4vc2NlbmUvbW9ycGguanMnO1xuaW1wb3J0IHsgTW9ycGhJbnN0YW5jZSB9IGZyb20gJy4uLy4uL3NjZW5lL21vcnBoLWluc3RhbmNlLmpzJztcbmltcG9ydCB7IE1vcnBoVGFyZ2V0IH0gZnJvbSAnLi4vLi4vc2NlbmUvbW9ycGgtdGFyZ2V0LmpzJztcbmltcG9ydCB7IFNraW4gfSBmcm9tICcuLi8uLi9zY2VuZS9za2luLmpzJztcbmltcG9ydCB7IFNraW5JbnN0YW5jZSB9IGZyb20gJy4uLy4uL3NjZW5lL3NraW4taW5zdGFuY2UuanMnO1xuXG5jb25zdCBKU09OX1BSSU1JVElWRV9UWVBFID0ge1xuICAgICdwb2ludHMnOiBQUklNSVRJVkVfUE9JTlRTLFxuICAgICdsaW5lcyc6IFBSSU1JVElWRV9MSU5FUyxcbiAgICAnbGluZWxvb3AnOiBQUklNSVRJVkVfTElORUxPT1AsXG4gICAgJ2xpbmVzdHJpcCc6IFBSSU1JVElWRV9MSU5FU1RSSVAsXG4gICAgJ3RyaWFuZ2xlcyc6IFBSSU1JVElWRV9UUklBTkdMRVMsXG4gICAgJ3RyaWFuZ2xlc3RyaXAnOiBQUklNSVRJVkVfVFJJU1RSSVAsXG4gICAgJ3RyaWFuZ2xlZmFuJzogUFJJTUlUSVZFX1RSSUZBTlxufTtcblxuY29uc3QgSlNPTl9WRVJURVhfRUxFTUVOVF9UWVBFID0ge1xuICAgICdpbnQ4JzogVFlQRV9JTlQ4LFxuICAgICd1aW50OCc6IFRZUEVfVUlOVDgsXG4gICAgJ2ludDE2JzogVFlQRV9JTlQxNixcbiAgICAndWludDE2JzogVFlQRV9VSU5UMTYsXG4gICAgJ2ludDMyJzogVFlQRV9JTlQzMixcbiAgICAndWludDMyJzogVFlQRV9VSU5UMzIsXG4gICAgJ2Zsb2F0MzInOiBUWVBFX0ZMT0FUMzJcbn07XG5cbi8vIFRha2UgUGxheUNhbnZhcyBKU09OIG1vZGVsIGRhdGEgYW5kIGNyZWF0ZSBwYy5Nb2RlbFxuY2xhc3MgSnNvbk1vZGVsUGFyc2VyIHtcbiAgICBjb25zdHJ1Y3RvcihkZXZpY2UsIGRlZmF1bHRNYXRlcmlhbCkge1xuICAgICAgICB0aGlzLl9kZXZpY2UgPSBkZXZpY2U7XG4gICAgICAgIHRoaXMuX2RlZmF1bHRNYXRlcmlhbCA9IGRlZmF1bHRNYXRlcmlhbDtcbiAgICB9XG5cbiAgICBwYXJzZShkYXRhLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBtb2RlbERhdGEgPSBkYXRhLm1vZGVsO1xuICAgICAgICBpZiAoIW1vZGVsRGF0YSkge1xuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgbnVsbCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobW9kZWxEYXRhLnZlcnNpb24gPD0gMSkge1xuICAgICAgICAgICAgY2FsbGJhY2soJ0pzb25Nb2RlbFBhcnNlciNwYXJzZTogVHJ5aW5nIHRvIHBhcnNlIHVuc3VwcG9ydGVkIG1vZGVsIGZvcm1hdC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5PREUgSElFUkFSQ0hZXG4gICAgICAgIGNvbnN0IG5vZGVzID0gdGhpcy5fcGFyc2VOb2RlcyhkYXRhKTtcblxuICAgICAgICAvLyBTS0lOU1xuICAgICAgICBjb25zdCBza2lucyA9IHRoaXMuX3BhcnNlU2tpbnMoZGF0YSwgbm9kZXMpO1xuXG4gICAgICAgIC8vIFZFUlRFWCBCVUZGRVJTXG4gICAgICAgIGNvbnN0IHZlcnRleEJ1ZmZlcnMgPSB0aGlzLl9wYXJzZVZlcnRleEJ1ZmZlcnMoZGF0YSk7XG5cbiAgICAgICAgLy8gSU5ERVggQlVGRkVSXG4gICAgICAgIGNvbnN0IGluZGljZXMgPSB0aGlzLl9wYXJzZUluZGV4QnVmZmVycyhkYXRhLCB2ZXJ0ZXhCdWZmZXJzKTtcblxuICAgICAgICAvLyBNT1JQSFNcbiAgICAgICAgY29uc3QgbW9ycGhzID0gdGhpcy5fcGFyc2VNb3JwaHMoZGF0YSwgbm9kZXMsIHZlcnRleEJ1ZmZlcnMpO1xuXG4gICAgICAgIC8vIE1FU0hFU1xuICAgICAgICBjb25zdCBtZXNoZXMgPSB0aGlzLl9wYXJzZU1lc2hlcyhkYXRhLCBza2lucy5za2lucywgbW9ycGhzLm1vcnBocywgdmVydGV4QnVmZmVycywgaW5kaWNlcy5idWZmZXIsIGluZGljZXMuZGF0YSk7XG5cbiAgICAgICAgLy8gTUVTSCBJTlNUQU5DRVNcbiAgICAgICAgY29uc3QgbWVzaEluc3RhbmNlcyA9IHRoaXMuX3BhcnNlTWVzaEluc3RhbmNlcyhkYXRhLCBub2RlcywgbWVzaGVzLCBza2lucy5za2lucywgc2tpbnMuaW5zdGFuY2VzLCBtb3JwaHMubW9ycGhzLCBtb3JwaHMuaW5zdGFuY2VzKTtcblxuICAgICAgICBjb25zdCBtb2RlbCA9IG5ldyBNb2RlbCgpO1xuICAgICAgICBtb2RlbC5ncmFwaCA9IG5vZGVzWzBdO1xuICAgICAgICBtb2RlbC5tZXNoSW5zdGFuY2VzID0gbWVzaEluc3RhbmNlcztcbiAgICAgICAgbW9kZWwuc2tpbkluc3RhbmNlcyA9IHNraW5zLmluc3RhbmNlcztcbiAgICAgICAgbW9kZWwubW9ycGhJbnN0YW5jZXMgPSBtb3JwaHMuaW5zdGFuY2VzO1xuICAgICAgICBtb2RlbC5nZXRHcmFwaCgpLnN5bmNIaWVyYXJjaHkoKTtcblxuICAgICAgICBjYWxsYmFjayhudWxsLCBtb2RlbCk7XG4gICAgfVxuXG4gICAgX3BhcnNlTm9kZXMoZGF0YSkge1xuICAgICAgICBjb25zdCBtb2RlbERhdGEgPSBkYXRhLm1vZGVsO1xuICAgICAgICBjb25zdCBub2RlcyA9IFtdO1xuICAgICAgICBsZXQgaTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbW9kZWxEYXRhLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlRGF0YSA9IG1vZGVsRGF0YS5ub2Rlc1tpXTtcblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5ldyBHcmFwaE5vZGUobm9kZURhdGEubmFtZSk7XG4gICAgICAgICAgICBub2RlLnNldExvY2FsUG9zaXRpb24obm9kZURhdGEucG9zaXRpb25bMF0sIG5vZGVEYXRhLnBvc2l0aW9uWzFdLCBub2RlRGF0YS5wb3NpdGlvblsyXSk7XG4gICAgICAgICAgICBub2RlLnNldExvY2FsRXVsZXJBbmdsZXMobm9kZURhdGEucm90YXRpb25bMF0sIG5vZGVEYXRhLnJvdGF0aW9uWzFdLCBub2RlRGF0YS5yb3RhdGlvblsyXSk7XG4gICAgICAgICAgICBub2RlLnNldExvY2FsU2NhbGUobm9kZURhdGEuc2NhbGVbMF0sIG5vZGVEYXRhLnNjYWxlWzFdLCBub2RlRGF0YS5zY2FsZVsyXSk7XG4gICAgICAgICAgICBub2RlLnNjYWxlQ29tcGVuc2F0aW9uID0gISFub2RlRGF0YS5zY2FsZUNvbXBlbnNhdGlvbjtcblxuICAgICAgICAgICAgbm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBtb2RlbERhdGEucGFyZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbm9kZXNbbW9kZWxEYXRhLnBhcmVudHNbaV1dLmFkZENoaWxkKG5vZGVzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlcztcbiAgICB9XG5cbiAgICBfcGFyc2VTa2lucyhkYXRhLCBub2Rlcykge1xuICAgICAgICBjb25zdCBtb2RlbERhdGEgPSBkYXRhLm1vZGVsO1xuICAgICAgICBjb25zdCBza2lucyA9IFtdO1xuICAgICAgICBjb25zdCBza2luSW5zdGFuY2VzID0gW107XG4gICAgICAgIGxldCBpLCBqO1xuXG4gICAgICAgIGlmICghdGhpcy5fZGV2aWNlLnN1cHBvcnRzQm9uZVRleHR1cmVzICYmIG1vZGVsRGF0YS5za2lucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBib25lTGltaXQgPSB0aGlzLl9kZXZpY2UuZ2V0Qm9uZUxpbWl0KCk7XG4gICAgICAgICAgICBwYXJ0aXRpb25Ta2luKG1vZGVsRGF0YSwgbnVsbCwgYm9uZUxpbWl0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBtb2RlbERhdGEuc2tpbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHNraW5EYXRhID0gbW9kZWxEYXRhLnNraW5zW2ldO1xuXG4gICAgICAgICAgICBjb25zdCBpbnZlcnNlQmluZE1hdHJpY2VzID0gW107XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgc2tpbkRhdGEuaW52ZXJzZUJpbmRNYXRyaWNlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlibSA9IHNraW5EYXRhLmludmVyc2VCaW5kTWF0cmljZXNbal07XG4gICAgICAgICAgICAgICAgaW52ZXJzZUJpbmRNYXRyaWNlc1tqXSA9IG5ldyBNYXQ0KCkuc2V0KGlibSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHNraW4gPSBuZXcgU2tpbih0aGlzLl9kZXZpY2UsIGludmVyc2VCaW5kTWF0cmljZXMsIHNraW5EYXRhLmJvbmVOYW1lcyk7XG4gICAgICAgICAgICBza2lucy5wdXNoKHNraW4pO1xuXG4gICAgICAgICAgICBjb25zdCBza2luSW5zdGFuY2UgPSBuZXcgU2tpbkluc3RhbmNlKHNraW4pO1xuICAgICAgICAgICAgLy8gUmVzb2x2ZSBib25lIElEcyB0byBhY3R1YWwgZ3JhcGggbm9kZXNcbiAgICAgICAgICAgIGNvbnN0IGJvbmVzID0gW107XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgc2tpbi5ib25lTmFtZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBib25lTmFtZSA9IHNraW4uYm9uZU5hbWVzW2pdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJvbmUgPSBub2Rlc1swXS5maW5kQnlOYW1lKGJvbmVOYW1lKTtcbiAgICAgICAgICAgICAgICBib25lcy5wdXNoKGJvbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2tpbkluc3RhbmNlLmJvbmVzID0gYm9uZXM7XG4gICAgICAgICAgICBza2luSW5zdGFuY2VzLnB1c2goc2tpbkluc3RhbmNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBza2luczogc2tpbnMsXG4gICAgICAgICAgICBpbnN0YW5jZXM6IHNraW5JbnN0YW5jZXNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBmaW5kIG51bWJlciBvZiB2ZXJ0aWNlcyB1c2VkIGJ5IGEgbWVzaCB0aGF0IGlzIHVzaW5nIG1vcnBoIHRhcmdldCB3aXRoIGluZGV4IG1vcnBoSW5kZXhcbiAgICBfZ2V0TW9ycGhWZXJ0ZXhDb3VudChtb2RlbERhdGEsIG1vcnBoSW5kZXgsIHZlcnRleEJ1ZmZlcnMpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb2RlbERhdGEubWVzaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBtZXNoRGF0YSA9IG1vZGVsRGF0YS5tZXNoZXNbaV07XG5cbiAgICAgICAgICAgIGlmIChtZXNoRGF0YS5tb3JwaCA9PT0gbW9ycGhJbmRleCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleEJ1ZmZlciA9IHZlcnRleEJ1ZmZlcnNbbWVzaERhdGEudmVydGljZXNdO1xuICAgICAgICAgICAgICAgIHJldHVybiB2ZXJ0ZXhCdWZmZXIubnVtVmVydGljZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBfcGFyc2VNb3JwaHMoZGF0YSwgbm9kZXMsIHZlcnRleEJ1ZmZlcnMpIHtcbiAgICAgICAgY29uc3QgbW9kZWxEYXRhID0gZGF0YS5tb2RlbDtcbiAgICAgICAgY29uc3QgbW9ycGhzID0gW107XG4gICAgICAgIGNvbnN0IG1vcnBoSW5zdGFuY2VzID0gW107XG4gICAgICAgIGxldCBpLCBqLCB2ZXJ0ZXhDb3VudDtcblxuICAgICAgICBsZXQgdGFyZ2V0cywgbW9ycGhUYXJnZXQsIG1vcnBoVGFyZ2V0QXJyYXk7XG5cbiAgICAgICAgaWYgKG1vZGVsRGF0YS5tb3JwaHMpIHtcblxuICAgICAgICAgICAgLy8gY29udmVydCBzcGFyc2UgbW9ycGggdGFyZ2V0IHZlcnRleCBkYXRhIHRvIGZ1bGwgZm9ybWF0XG4gICAgICAgICAgICBjb25zdCBzcGFyc2VUb0Z1bGwgPSBmdW5jdGlvbiAoZGF0YSwgaW5kaWNlcywgdG90YWxDb3VudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZ1bGwgPSBuZXcgRmxvYXQzMkFycmF5KHRvdGFsQ291bnQgKiAzKTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBzID0gMDsgcyA8IGluZGljZXMubGVuZ3RoOyBzKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHN0SW5kZXggPSBpbmRpY2VzW3NdICogMztcbiAgICAgICAgICAgICAgICAgICAgZnVsbFtkc3RJbmRleF0gPSBkYXRhW3MgKiAzXTtcbiAgICAgICAgICAgICAgICAgICAgZnVsbFtkc3RJbmRleCArIDFdID0gZGF0YVtzICogMyArIDFdO1xuICAgICAgICAgICAgICAgICAgICBmdWxsW2RzdEluZGV4ICsgMl0gPSBkYXRhW3MgKiAzICsgMl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmdWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG1vZGVsRGF0YS5tb3JwaHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRzID0gbW9kZWxEYXRhLm1vcnBoc1tpXS50YXJnZXRzO1xuICAgICAgICAgICAgICAgIG1vcnBoVGFyZ2V0QXJyYXkgPSBbXTtcblxuICAgICAgICAgICAgICAgIC8vIHRvdGFsIG51bWJlciBvZiB2ZXJ0aWNpZXMgb2YgdGhlIG1lc2hcbiAgICAgICAgICAgICAgICB2ZXJ0ZXhDb3VudCA9IHRoaXMuX2dldE1vcnBoVmVydGV4Q291bnQobW9kZWxEYXRhLCBpLCB2ZXJ0ZXhCdWZmZXJzKTtcblxuICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCB0YXJnZXRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldEFhYmIgPSB0YXJnZXRzW2pdLmFhYmI7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWluID0gdGFyZ2V0QWFiYi5taW47XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heCA9IHRhcmdldEFhYmIubWF4O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYWJiID0gbmV3IEJvdW5kaW5nQm94KFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFZlYzMoKG1heFswXSArIG1pblswXSkgKiAwLjUsIChtYXhbMV0gKyBtaW5bMV0pICogMC41LCAobWF4WzJdICsgbWluWzJdKSAqIDAuNSksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgVmVjMygobWF4WzBdIC0gbWluWzBdKSAqIDAuNSwgKG1heFsxXSAtIG1pblsxXSkgKiAwLjUsIChtYXhbMl0gLSBtaW5bMl0pICogMC41KVxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnZlcnQgc3BhcnNlIHRvIGZ1bGwgZm9ybWF0XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZGljZXMgPSB0YXJnZXRzW2pdLmluZGljZXM7XG4gICAgICAgICAgICAgICAgICAgIGxldCBkZWx0YVBvc2l0aW9ucyA9IHRhcmdldHNbal0uZGVsdGFQb3NpdGlvbnM7XG4gICAgICAgICAgICAgICAgICAgIGxldCBkZWx0YU5vcm1hbHMgPSB0YXJnZXRzW2pdLmRlbHRhTm9ybWFscztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGljZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhUG9zaXRpb25zID0gc3BhcnNlVG9GdWxsKGRlbHRhUG9zaXRpb25zLCBpbmRpY2VzLCB2ZXJ0ZXhDb3VudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWx0YU5vcm1hbHMgPSBzcGFyc2VUb0Z1bGwoZGVsdGFOb3JtYWxzLCBpbmRpY2VzLCB2ZXJ0ZXhDb3VudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBtb3JwaFRhcmdldCA9IG5ldyBNb3JwaFRhcmdldCh7IGRlbHRhUG9zaXRpb25zOiBkZWx0YVBvc2l0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhTm9ybWFsczogZGVsdGFOb3JtYWxzLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdGFyZ2V0c1tqXS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWFiYjogYWFiYiB9KTtcblxuICAgICAgICAgICAgICAgICAgICBtb3JwaFRhcmdldEFycmF5LnB1c2gobW9ycGhUYXJnZXQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IG1vcnBoID0gbmV3IE1vcnBoKG1vcnBoVGFyZ2V0QXJyYXksIHRoaXMuX2RldmljZSk7XG4gICAgICAgICAgICAgICAgbW9ycGhzLnB1c2gobW9ycGgpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgbW9ycGhJbnN0YW5jZSA9IG5ldyBNb3JwaEluc3RhbmNlKG1vcnBoKTtcbiAgICAgICAgICAgICAgICBtb3JwaEluc3RhbmNlcy5wdXNoKG1vcnBoSW5zdGFuY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1vcnBoczogbW9ycGhzLFxuICAgICAgICAgICAgaW5zdGFuY2VzOiBtb3JwaEluc3RhbmNlc1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9wYXJzZVZlcnRleEJ1ZmZlcnMoZGF0YSkge1xuICAgICAgICBjb25zdCBtb2RlbERhdGEgPSBkYXRhLm1vZGVsO1xuICAgICAgICBjb25zdCB2ZXJ0ZXhCdWZmZXJzID0gW107XG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZU1hcCA9IHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBTRU1BTlRJQ19QT1NJVElPTixcbiAgICAgICAgICAgIG5vcm1hbDogU0VNQU5USUNfTk9STUFMLFxuICAgICAgICAgICAgdGFuZ2VudDogU0VNQU5USUNfVEFOR0VOVCxcbiAgICAgICAgICAgIGJsZW5kV2VpZ2h0OiBTRU1BTlRJQ19CTEVORFdFSUdIVCxcbiAgICAgICAgICAgIGJsZW5kSW5kaWNlczogU0VNQU5USUNfQkxFTkRJTkRJQ0VTLFxuICAgICAgICAgICAgY29sb3I6IFNFTUFOVElDX0NPTE9SLFxuICAgICAgICAgICAgdGV4Q29vcmQwOiBTRU1BTlRJQ19URVhDT09SRDAsXG4gICAgICAgICAgICB0ZXhDb29yZDE6IFNFTUFOVElDX1RFWENPT1JEMSxcbiAgICAgICAgICAgIHRleENvb3JkMjogU0VNQU5USUNfVEVYQ09PUkQyLFxuICAgICAgICAgICAgdGV4Q29vcmQzOiBTRU1BTlRJQ19URVhDT09SRDMsXG4gICAgICAgICAgICB0ZXhDb29yZDQ6IFNFTUFOVElDX1RFWENPT1JENCxcbiAgICAgICAgICAgIHRleENvb3JkNTogU0VNQU5USUNfVEVYQ09PUkQ1LFxuICAgICAgICAgICAgdGV4Q29vcmQ2OiBTRU1BTlRJQ19URVhDT09SRDYsXG4gICAgICAgICAgICB0ZXhDb29yZDc6IFNFTUFOVElDX1RFWENPT1JEN1xuICAgICAgICB9O1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbW9kZWxEYXRhLnZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB2ZXJ0ZXhEYXRhID0gbW9kZWxEYXRhLnZlcnRpY2VzW2ldO1xuXG4gICAgICAgICAgICBjb25zdCBmb3JtYXREZXNjID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gdmVydGV4RGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IHZlcnRleERhdGFbYXR0cmlidXRlTmFtZV07XG5cbiAgICAgICAgICAgICAgICBmb3JtYXREZXNjLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBzZW1hbnRpYzogYXR0cmlidXRlTWFwW2F0dHJpYnV0ZU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRzOiBhdHRyaWJ1dGUuY29tcG9uZW50cyxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogSlNPTl9WRVJURVhfRUxFTUVOVF9UWVBFW2F0dHJpYnV0ZS50eXBlXSxcbiAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplOiAoYXR0cmlidXRlTWFwW2F0dHJpYnV0ZU5hbWVdID09PSBTRU1BTlRJQ19DT0xPUilcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHZlcnRleEZvcm1hdCA9IG5ldyBWZXJ0ZXhGb3JtYXQodGhpcy5fZGV2aWNlLCBmb3JtYXREZXNjKTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSB2ZXJ0ZXggYnVmZmVyXG4gICAgICAgICAgICBjb25zdCBudW1WZXJ0aWNlcyA9IHZlcnRleERhdGEucG9zaXRpb24uZGF0YS5sZW5ndGggLyB2ZXJ0ZXhEYXRhLnBvc2l0aW9uLmNvbXBvbmVudHM7XG4gICAgICAgICAgICBjb25zdCB2ZXJ0ZXhCdWZmZXIgPSBuZXcgVmVydGV4QnVmZmVyKHRoaXMuX2RldmljZSwgdmVydGV4Rm9ybWF0LCBudW1WZXJ0aWNlcyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGl0ZXJhdG9yID0gbmV3IFZlcnRleEl0ZXJhdG9yKHZlcnRleEJ1ZmZlcik7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG51bVZlcnRpY2VzOyBqKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gdmVydGV4RGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSB2ZXJ0ZXhEYXRhW2F0dHJpYnV0ZU5hbWVdO1xuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoYXR0cmlidXRlLmNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVyYXRvci5lbGVtZW50W2F0dHJpYnV0ZU1hcFthdHRyaWJ1dGVOYW1lXV0uc2V0KGF0dHJpYnV0ZS5kYXRhW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVyYXRvci5lbGVtZW50W2F0dHJpYnV0ZU1hcFthdHRyaWJ1dGVOYW1lXV0uc2V0KGF0dHJpYnV0ZS5kYXRhW2ogKiAyXSwgMS4wIC0gYXR0cmlidXRlLmRhdGFbaiAqIDIgKyAxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlcmF0b3IuZWxlbWVudFthdHRyaWJ1dGVNYXBbYXR0cmlidXRlTmFtZV1dLnNldChhdHRyaWJ1dGUuZGF0YVtqICogM10sIGF0dHJpYnV0ZS5kYXRhW2ogKiAzICsgMV0sIGF0dHJpYnV0ZS5kYXRhW2ogKiAzICsgMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdG9yLmVsZW1lbnRbYXR0cmlidXRlTWFwW2F0dHJpYnV0ZU5hbWVdXS5zZXQoYXR0cmlidXRlLmRhdGFbaiAqIDRdLCBhdHRyaWJ1dGUuZGF0YVtqICogNCArIDFdLCBhdHRyaWJ1dGUuZGF0YVtqICogNCArIDJdLCBhdHRyaWJ1dGUuZGF0YVtqICogNCArIDNdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpdGVyYXRvci5lbmQoKTtcblxuICAgICAgICAgICAgdmVydGV4QnVmZmVycy5wdXNoKHZlcnRleEJ1ZmZlcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmVydGV4QnVmZmVycztcbiAgICB9XG5cbiAgICBfcGFyc2VJbmRleEJ1ZmZlcnMoZGF0YSwgdmVydGV4QnVmZmVycykge1xuICAgICAgICBjb25zdCBtb2RlbERhdGEgPSBkYXRhLm1vZGVsO1xuICAgICAgICBsZXQgaW5kZXhCdWZmZXIgPSBudWxsO1xuICAgICAgICBsZXQgaW5kZXhEYXRhID0gbnVsbDtcbiAgICAgICAgbGV0IGk7XG5cbiAgICAgICAgLy8gQ291bnQgdGhlIG51bWJlciBvZiBpbmRpY2VzIGluIHRoZSBtb2RlbFxuICAgICAgICBsZXQgbnVtSW5kaWNlcyA9IDA7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBtb2RlbERhdGEubWVzaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBtZXNoRGF0YSA9IG1vZGVsRGF0YS5tZXNoZXNbaV07XG4gICAgICAgICAgICBpZiAobWVzaERhdGEuaW5kaWNlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbnVtSW5kaWNlcyArPSBtZXNoRGF0YS5pbmRpY2VzLmxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSBhbiBpbmRleCBidWZmZXIgYmlnIGVub3VnaCB0byBzdG9yZSBhbGwgaW5kaWNlcyBpbiB0aGUgbW9kZWxcbiAgICAgICAgbGV0IG1heFZlcnRzID0gMDtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHZlcnRleEJ1ZmZlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG1heFZlcnRzID0gTWF0aC5tYXgobWF4VmVydHMsIHZlcnRleEJ1ZmZlcnNbaV0ubnVtVmVydGljZXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChudW1JbmRpY2VzID4gMCkge1xuICAgICAgICAgICAgaWYgKG1heFZlcnRzID4gMHhGRkZGICYmIHRoaXMuX2RldmljZS5leHRVaW50RWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGluZGV4QnVmZmVyID0gbmV3IEluZGV4QnVmZmVyKHRoaXMuX2RldmljZSwgSU5ERVhGT1JNQVRfVUlOVDMyLCBudW1JbmRpY2VzKTtcbiAgICAgICAgICAgICAgICBpbmRleERhdGEgPSBuZXcgVWludDMyQXJyYXkoaW5kZXhCdWZmZXIubG9jaygpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5kZXhCdWZmZXIgPSBuZXcgSW5kZXhCdWZmZXIodGhpcy5fZGV2aWNlLCBJTkRFWEZPUk1BVF9VSU5UMTYsIG51bUluZGljZXMpO1xuICAgICAgICAgICAgICAgIGluZGV4RGF0YSA9IG5ldyBVaW50MTZBcnJheShpbmRleEJ1ZmZlci5sb2NrKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGJ1ZmZlcjogaW5kZXhCdWZmZXIsXG4gICAgICAgICAgICBkYXRhOiBpbmRleERhdGFcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBfcGFyc2VNZXNoZXMoZGF0YSwgc2tpbnMsIG1vcnBocywgdmVydGV4QnVmZmVycywgaW5kZXhCdWZmZXIsIGluZGV4RGF0YSkge1xuICAgICAgICBjb25zdCBtb2RlbERhdGEgPSBkYXRhLm1vZGVsO1xuXG4gICAgICAgIGNvbnN0IG1lc2hlcyA9IFtdO1xuICAgICAgICBsZXQgaW5kZXhCYXNlID0gMDtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1vZGVsRGF0YS5tZXNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG1lc2hEYXRhID0gbW9kZWxEYXRhLm1lc2hlc1tpXTtcblxuICAgICAgICAgICAgY29uc3QgbWVzaEFhYmIgPSBtZXNoRGF0YS5hYWJiO1xuICAgICAgICAgICAgY29uc3QgbWluID0gbWVzaEFhYmIubWluO1xuICAgICAgICAgICAgY29uc3QgbWF4ID0gbWVzaEFhYmIubWF4O1xuICAgICAgICAgICAgY29uc3QgYWFiYiA9IG5ldyBCb3VuZGluZ0JveChcbiAgICAgICAgICAgICAgICBuZXcgVmVjMygobWF4WzBdICsgbWluWzBdKSAqIDAuNSwgKG1heFsxXSArIG1pblsxXSkgKiAwLjUsIChtYXhbMl0gKyBtaW5bMl0pICogMC41KSxcbiAgICAgICAgICAgICAgICBuZXcgVmVjMygobWF4WzBdIC0gbWluWzBdKSAqIDAuNSwgKG1heFsxXSAtIG1pblsxXSkgKiAwLjUsIChtYXhbMl0gLSBtaW5bMl0pICogMC41KVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgY29uc3QgaW5kZXhlZCA9IChtZXNoRGF0YS5pbmRpY2VzICE9PSB1bmRlZmluZWQpO1xuICAgICAgICAgICAgY29uc3QgbWVzaCA9IG5ldyBNZXNoKHRoaXMuX2RldmljZSk7XG4gICAgICAgICAgICBtZXNoLnZlcnRleEJ1ZmZlciA9IHZlcnRleEJ1ZmZlcnNbbWVzaERhdGEudmVydGljZXNdO1xuICAgICAgICAgICAgbWVzaC5pbmRleEJ1ZmZlclswXSA9IGluZGV4ZWQgPyBpbmRleEJ1ZmZlciA6IG51bGw7XG4gICAgICAgICAgICBtZXNoLnByaW1pdGl2ZVswXS50eXBlID0gSlNPTl9QUklNSVRJVkVfVFlQRVttZXNoRGF0YS50eXBlXTtcbiAgICAgICAgICAgIG1lc2gucHJpbWl0aXZlWzBdLmJhc2UgPSBpbmRleGVkID8gKG1lc2hEYXRhLmJhc2UgKyBpbmRleEJhc2UpIDogbWVzaERhdGEuYmFzZTtcbiAgICAgICAgICAgIG1lc2gucHJpbWl0aXZlWzBdLmNvdW50ID0gbWVzaERhdGEuY291bnQ7XG4gICAgICAgICAgICBtZXNoLnByaW1pdGl2ZVswXS5pbmRleGVkID0gaW5kZXhlZDtcbiAgICAgICAgICAgIG1lc2guc2tpbiA9IChtZXNoRGF0YS5za2luICE9PSB1bmRlZmluZWQpID8gc2tpbnNbbWVzaERhdGEuc2tpbl0gOiBudWxsO1xuICAgICAgICAgICAgbWVzaC5tb3JwaCA9IChtZXNoRGF0YS5tb3JwaCAhPT0gdW5kZWZpbmVkKSA/IG1vcnBoc1ttZXNoRGF0YS5tb3JwaF0gOiBudWxsO1xuICAgICAgICAgICAgbWVzaC5hYWJiID0gYWFiYjtcblxuICAgICAgICAgICAgaWYgKGluZGV4ZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGhlIGluZGV4IGJ1ZmZlclxuICAgICAgICAgICAgICAgIGluZGV4RGF0YS5zZXQobWVzaERhdGEuaW5kaWNlcywgaW5kZXhCYXNlKTtcbiAgICAgICAgICAgICAgICBpbmRleEJhc2UgKz0gbWVzaERhdGEuaW5kaWNlcy5sZW5ndGg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1lc2hlcy5wdXNoKG1lc2gpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluZGV4QnVmZmVyICE9PSBudWxsKSB7XG4gICAgICAgICAgICBpbmRleEJ1ZmZlci51bmxvY2soKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtZXNoZXM7XG4gICAgfVxuXG4gICAgX3BhcnNlTWVzaEluc3RhbmNlcyhkYXRhLCBub2RlcywgbWVzaGVzLCBza2lucywgc2tpbkluc3RhbmNlcywgbW9ycGhzLCBtb3JwaEluc3RhbmNlcykge1xuICAgICAgICBjb25zdCBtb2RlbERhdGEgPSBkYXRhLm1vZGVsO1xuICAgICAgICBjb25zdCBtZXNoSW5zdGFuY2VzID0gW107XG4gICAgICAgIGxldCBpO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBtb2RlbERhdGEubWVzaEluc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgbWVzaEluc3RhbmNlRGF0YSA9IG1vZGVsRGF0YS5tZXNoSW5zdGFuY2VzW2ldO1xuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbbWVzaEluc3RhbmNlRGF0YS5ub2RlXTtcbiAgICAgICAgICAgIGNvbnN0IG1lc2ggPSBtZXNoZXNbbWVzaEluc3RhbmNlRGF0YS5tZXNoXTtcblxuICAgICAgICAgICAgY29uc3QgbWVzaEluc3RhbmNlID0gbmV3IE1lc2hJbnN0YW5jZShtZXNoLCB0aGlzLl9kZWZhdWx0TWF0ZXJpYWwsIG5vZGUpO1xuXG4gICAgICAgICAgICBpZiAobWVzaC5za2luKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2tpbkluZGV4ID0gc2tpbnMuaW5kZXhPZihtZXNoLnNraW4pO1xuICAgICAgICAgICAgICAgIC8vICNpZiBfREVCVUdcbiAgICAgICAgICAgICAgICBpZiAoc2tpbkluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01lc2hcXCdzIHNraW4gZG9lcyBub3QgYXBwZWFyIGluIHNraW4gYXJyYXkuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vICNlbmRpZlxuICAgICAgICAgICAgICAgIG1lc2hJbnN0YW5jZS5za2luSW5zdGFuY2UgPSBza2luSW5zdGFuY2VzW3NraW5JbmRleF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChtZXNoLm1vcnBoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbW9ycGhJbmRleCA9IG1vcnBocy5pbmRleE9mKG1lc2gubW9ycGgpO1xuICAgICAgICAgICAgICAgIC8vICNpZiBfREVCVUdcbiAgICAgICAgICAgICAgICBpZiAobW9ycGhJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNZXNoXFwncyBtb3JwaCBkb2VzIG5vdCBhcHBlYXIgaW4gbW9ycGggYXJyYXkuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vICNlbmRpZlxuICAgICAgICAgICAgICAgIG1lc2hJbnN0YW5jZS5tb3JwaEluc3RhbmNlID0gbW9ycGhJbnN0YW5jZXNbbW9ycGhJbmRleF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1lc2hJbnN0YW5jZXMucHVzaChtZXNoSW5zdGFuY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1lc2hJbnN0YW5jZXM7XG4gICAgfVxufVxuXG5leHBvcnQgeyBKc29uTW9kZWxQYXJzZXIgfTtcbiJdLCJuYW1lcyI6WyJKU09OX1BSSU1JVElWRV9UWVBFIiwiUFJJTUlUSVZFX1BPSU5UUyIsIlBSSU1JVElWRV9MSU5FUyIsIlBSSU1JVElWRV9MSU5FTE9PUCIsIlBSSU1JVElWRV9MSU5FU1RSSVAiLCJQUklNSVRJVkVfVFJJQU5HTEVTIiwiUFJJTUlUSVZFX1RSSVNUUklQIiwiUFJJTUlUSVZFX1RSSUZBTiIsIkpTT05fVkVSVEVYX0VMRU1FTlRfVFlQRSIsIlRZUEVfSU5UOCIsIlRZUEVfVUlOVDgiLCJUWVBFX0lOVDE2IiwiVFlQRV9VSU5UMTYiLCJUWVBFX0lOVDMyIiwiVFlQRV9VSU5UMzIiLCJUWVBFX0ZMT0FUMzIiLCJKc29uTW9kZWxQYXJzZXIiLCJjb25zdHJ1Y3RvciIsImRldmljZSIsImRlZmF1bHRNYXRlcmlhbCIsIl9kZXZpY2UiLCJfZGVmYXVsdE1hdGVyaWFsIiwicGFyc2UiLCJkYXRhIiwiY2FsbGJhY2siLCJtb2RlbERhdGEiLCJtb2RlbCIsInZlcnNpb24iLCJub2RlcyIsIl9wYXJzZU5vZGVzIiwic2tpbnMiLCJfcGFyc2VTa2lucyIsInZlcnRleEJ1ZmZlcnMiLCJfcGFyc2VWZXJ0ZXhCdWZmZXJzIiwiaW5kaWNlcyIsIl9wYXJzZUluZGV4QnVmZmVycyIsIm1vcnBocyIsIl9wYXJzZU1vcnBocyIsIm1lc2hlcyIsIl9wYXJzZU1lc2hlcyIsImJ1ZmZlciIsIm1lc2hJbnN0YW5jZXMiLCJfcGFyc2VNZXNoSW5zdGFuY2VzIiwiaW5zdGFuY2VzIiwiTW9kZWwiLCJncmFwaCIsInNraW5JbnN0YW5jZXMiLCJtb3JwaEluc3RhbmNlcyIsImdldEdyYXBoIiwic3luY0hpZXJhcmNoeSIsImkiLCJsZW5ndGgiLCJub2RlRGF0YSIsIm5vZGUiLCJHcmFwaE5vZGUiLCJuYW1lIiwic2V0TG9jYWxQb3NpdGlvbiIsInBvc2l0aW9uIiwic2V0TG9jYWxFdWxlckFuZ2xlcyIsInJvdGF0aW9uIiwic2V0TG9jYWxTY2FsZSIsInNjYWxlIiwic2NhbGVDb21wZW5zYXRpb24iLCJwdXNoIiwicGFyZW50cyIsImFkZENoaWxkIiwiaiIsInN1cHBvcnRzQm9uZVRleHR1cmVzIiwiYm9uZUxpbWl0IiwiZ2V0Qm9uZUxpbWl0IiwicGFydGl0aW9uU2tpbiIsInNraW5EYXRhIiwiaW52ZXJzZUJpbmRNYXRyaWNlcyIsImlibSIsIk1hdDQiLCJzZXQiLCJza2luIiwiU2tpbiIsImJvbmVOYW1lcyIsInNraW5JbnN0YW5jZSIsIlNraW5JbnN0YW5jZSIsImJvbmVzIiwiYm9uZU5hbWUiLCJib25lIiwiZmluZEJ5TmFtZSIsIl9nZXRNb3JwaFZlcnRleENvdW50IiwibW9ycGhJbmRleCIsIm1lc2hEYXRhIiwibW9ycGgiLCJ2ZXJ0ZXhCdWZmZXIiLCJ2ZXJ0aWNlcyIsIm51bVZlcnRpY2VzIiwidW5kZWZpbmVkIiwidmVydGV4Q291bnQiLCJ0YXJnZXRzIiwibW9ycGhUYXJnZXQiLCJtb3JwaFRhcmdldEFycmF5Iiwic3BhcnNlVG9GdWxsIiwidG90YWxDb3VudCIsImZ1bGwiLCJGbG9hdDMyQXJyYXkiLCJzIiwiZHN0SW5kZXgiLCJ0YXJnZXRBYWJiIiwiYWFiYiIsIm1pbiIsIm1heCIsIkJvdW5kaW5nQm94IiwiVmVjMyIsImRlbHRhUG9zaXRpb25zIiwiZGVsdGFOb3JtYWxzIiwiTW9ycGhUYXJnZXQiLCJNb3JwaCIsIm1vcnBoSW5zdGFuY2UiLCJNb3JwaEluc3RhbmNlIiwiYXR0cmlidXRlTWFwIiwiU0VNQU5USUNfUE9TSVRJT04iLCJub3JtYWwiLCJTRU1BTlRJQ19OT1JNQUwiLCJ0YW5nZW50IiwiU0VNQU5USUNfVEFOR0VOVCIsImJsZW5kV2VpZ2h0IiwiU0VNQU5USUNfQkxFTkRXRUlHSFQiLCJibGVuZEluZGljZXMiLCJTRU1BTlRJQ19CTEVORElORElDRVMiLCJjb2xvciIsIlNFTUFOVElDX0NPTE9SIiwidGV4Q29vcmQwIiwiU0VNQU5USUNfVEVYQ09PUkQwIiwidGV4Q29vcmQxIiwiU0VNQU5USUNfVEVYQ09PUkQxIiwidGV4Q29vcmQyIiwiU0VNQU5USUNfVEVYQ09PUkQyIiwidGV4Q29vcmQzIiwiU0VNQU5USUNfVEVYQ09PUkQzIiwidGV4Q29vcmQ0IiwiU0VNQU5USUNfVEVYQ09PUkQ0IiwidGV4Q29vcmQ1IiwiU0VNQU5USUNfVEVYQ09PUkQ1IiwidGV4Q29vcmQ2IiwiU0VNQU5USUNfVEVYQ09PUkQ2IiwidGV4Q29vcmQ3IiwiU0VNQU5USUNfVEVYQ09PUkQ3IiwidmVydGV4RGF0YSIsImZvcm1hdERlc2MiLCJhdHRyaWJ1dGVOYW1lIiwiYXR0cmlidXRlIiwic2VtYW50aWMiLCJjb21wb25lbnRzIiwidHlwZSIsIm5vcm1hbGl6ZSIsInZlcnRleEZvcm1hdCIsIlZlcnRleEZvcm1hdCIsIlZlcnRleEJ1ZmZlciIsIml0ZXJhdG9yIiwiVmVydGV4SXRlcmF0b3IiLCJlbGVtZW50IiwibmV4dCIsImVuZCIsImluZGV4QnVmZmVyIiwiaW5kZXhEYXRhIiwibnVtSW5kaWNlcyIsIm1heFZlcnRzIiwiTWF0aCIsImV4dFVpbnRFbGVtZW50IiwiSW5kZXhCdWZmZXIiLCJJTkRFWEZPUk1BVF9VSU5UMzIiLCJVaW50MzJBcnJheSIsImxvY2siLCJJTkRFWEZPUk1BVF9VSU5UMTYiLCJVaW50MTZBcnJheSIsImluZGV4QmFzZSIsIm1lc2hBYWJiIiwiaW5kZXhlZCIsIm1lc2giLCJNZXNoIiwicHJpbWl0aXZlIiwiYmFzZSIsImNvdW50IiwidW5sb2NrIiwibWVzaEluc3RhbmNlRGF0YSIsIm1lc2hJbnN0YW5jZSIsIk1lc2hJbnN0YW5jZSIsInNraW5JbmRleCIsImluZGV4T2YiLCJFcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNEJBLE1BQU1BLG1CQUFtQixHQUFHO0FBQ3hCLEVBQUEsUUFBUSxFQUFFQyxnQkFBZ0I7QUFDMUIsRUFBQSxPQUFPLEVBQUVDLGVBQWU7QUFDeEIsRUFBQSxVQUFVLEVBQUVDLGtCQUFrQjtBQUM5QixFQUFBLFdBQVcsRUFBRUMsbUJBQW1CO0FBQ2hDLEVBQUEsV0FBVyxFQUFFQyxtQkFBbUI7QUFDaEMsRUFBQSxlQUFlLEVBQUVDLGtCQUFrQjtBQUNuQyxFQUFBLGFBQWEsRUFBRUMsZ0JBQUFBO0FBQ25CLENBQUMsQ0FBQTtBQUVE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
