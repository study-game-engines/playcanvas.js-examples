/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
const ANIM_INTERRUPTION_NONE = 'NONE';
const ANIM_INTERRUPTION_PREV = 'PREV_STATE';
const ANIM_INTERRUPTION_NEXT = 'NEXT_STATE';
const ANIM_INTERRUPTION_PREV_NEXT = 'PREV_STATE_NEXT_STATE';
const ANIM_INTERRUPTION_NEXT_PREV = 'NEXT_STATE_PREV_STATE';
const ANIM_GREATER_THAN = 'GREATER_THAN';
const ANIM_LESS_THAN = 'LESS_THAN';
const ANIM_GREATER_THAN_EQUAL_TO = 'GREATER_THAN_EQUAL_TO';
const ANIM_LESS_THAN_EQUAL_TO = 'LESS_THAN_EQUAL_TO';
const ANIM_EQUAL_TO = 'EQUAL_TO';
const ANIM_NOT_EQUAL_TO = 'NOT_EQUAL_TO';
const ANIM_PARAMETER_INTEGER = 'INTEGER';
const ANIM_PARAMETER_FLOAT = 'FLOAT';
const ANIM_PARAMETER_BOOLEAN = 'BOOLEAN';
const ANIM_PARAMETER_TRIGGER = 'TRIGGER';
const ANIM_BLEND_1D = '1D';
const ANIM_BLEND_2D_DIRECTIONAL = '2D_DIRECTIONAL';
const ANIM_BLEND_2D_CARTESIAN = '2D_CARTESIAN';
const ANIM_BLEND_DIRECT = 'DIRECT';
const ANIM_STATE_START = 'START';
const ANIM_STATE_END = 'END';
const ANIM_STATE_ANY = 'ANY';
const ANIM_CONTROL_STATES = [ANIM_STATE_START, ANIM_STATE_END, ANIM_STATE_ANY];
const ANIM_LAYER_OVERWRITE = 'OVERWRITE';
const ANIM_LAYER_ADDITIVE = 'ADDITIVE';

export { ANIM_BLEND_1D, ANIM_BLEND_2D_CARTESIAN, ANIM_BLEND_2D_DIRECTIONAL, ANIM_BLEND_DIRECT, ANIM_CONTROL_STATES, ANIM_EQUAL_TO, ANIM_GREATER_THAN, ANIM_GREATER_THAN_EQUAL_TO, ANIM_INTERRUPTION_NEXT, ANIM_INTERRUPTION_NEXT_PREV, ANIM_INTERRUPTION_NONE, ANIM_INTERRUPTION_PREV, ANIM_INTERRUPTION_PREV_NEXT, ANIM_LAYER_ADDITIVE, ANIM_LAYER_OVERWRITE, ANIM_LESS_THAN, ANIM_LESS_THAN_EQUAL_TO, ANIM_NOT_EQUAL_TO, ANIM_PARAMETER_BOOLEAN, ANIM_PARAMETER_FLOAT, ANIM_PARAMETER_INTEGER, ANIM_PARAMETER_TRIGGER, ANIM_STATE_ANY, ANIM_STATE_END, ANIM_STATE_START };
