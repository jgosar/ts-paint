export interface StretchSkewParams {
  stretch?: StretchParams;
  skew?: SkewParams;
}

export interface StretchParams {
  horizontal?: number;
  vertical?: number;
}

export interface SkewParams extends StretchParams {}
