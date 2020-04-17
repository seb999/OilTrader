export interface crudeOilTransfer{
    data : [crudeOilBaseClass];
    type: string
}

interface crudeOilBaseClass{
    p : number;
    s: string;
    t: number;
    v:number;
}