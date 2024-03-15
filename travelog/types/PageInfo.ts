export type PageInfo = {
    domain? : string
    url? : string
    dom? : Document
    accessed_date? : Date 
    places?: Place[]
}

type Place = {
    name: string
    type?: string
    address: string
    startDate?: Date
    endDate?: Date
    summary?: string
    coordinates?: GeolocationCoordinates
}