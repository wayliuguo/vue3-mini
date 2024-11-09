type HelperMap = {
    [key: string | symbol]: string
}

export const TO_DISPLAY_STRING = Symbol('toDisplayString')

export const helperMapName: HelperMap = {
    [TO_DISPLAY_STRING]: 'toDisplayString'
}
