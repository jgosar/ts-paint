import { RotateImageActionAngle } from '../actions/rotate-image-action';

export interface FlipRotateParams {
  flip?: 'horizontal' | 'vertical';
  rotate?: RotateImageActionAngle;
}
