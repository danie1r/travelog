
export interface PageInfo {
    domain? : string
    url? : string
    accessed_date? : Date 
    places?: Place[]
}

export interface Place {
    name: string
    category?: string
    address: string
    startDate?: Date
    endDate?: Date
    description?: string
    coordinates?: GeolocationCoordinates
    source?: string
    link?: string
    dateAccessed: Date
}

export interface ParseReturn {
    destinations : Place[]
}