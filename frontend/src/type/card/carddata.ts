import type { ImgSection } from "../image/imagesection";

export interface CardDataItem {
  id: number;
  groupName: string;
  rating: string;
  ratingText: string;
  imgSection: ImgSection[];
  link: string;
}