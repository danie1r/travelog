
export interface PageInfo {
    domain? : string
    url? : string
    accessed_date? : Date 
    places?: Place[]
}

export interface Place {
    name: string
    type?: string
    address: string
    startDate?: Date
    endDate?: Date
    description?: string
    coordinates?: GeolocationCoordinates
}

export interface ParseReturn {
    destinations : Place[]
}