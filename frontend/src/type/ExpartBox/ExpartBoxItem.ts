import type { ImgSection } from "../image/imagesection";

// Define a type for the data items
export interface ExpartBoxItem {
  id: number;
  groupName: string;
  rating: string;
  ratingText: string;
  imgSection: ImgSection[];
  link: string;
}