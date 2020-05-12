/*
 * Leaflet icons for start and end. Copied from github.com/conveyal/otp.js.
 */

import {icon} from 'leaflet'

export const startIcon = icon({
    iconUrl: 'data:image/png;base64,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',
    iconAnchor: [44, 41],
    iconSize: [48, 49],
    popupAnchor: [24, 0]
})

export const endIcon = icon({
    iconUrl: 'data:image/png;base64,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',
    iconAnchor: [44, 41],
    iconSize: [48, 49],
    popupAnchor: [24, 0]
})