export enum FillType{
  EMPTY,
  FILL_SECONDARY,
  FILL_PRIMARY
}

export const ALL_FILL_TYPES: FillType[] = Object.keys(FillType).map(t => FillType[t]).filter(t=> typeof t === "number");
