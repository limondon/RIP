export interface Customer {
  fullName: string;
  phone: string;
  additionalPhone: string;
  address: string;
  orderDate: string;
  manager: string;
  source: string;
  comment: string;
}

export interface BurialPlace {
  cemetery: string;
  section: string;
  row: string;
  place: string;
  deceasedFullName: string;
  birthDate: string;
  deathDate: string;
  demolitionRequired: boolean;
  comment: string;
}

export interface MonumentProduct {
  monumentType: string;
  material: string;
  color: string;
  shape: string;
  polishing: string;
  steleSize: { height: string; width: string; thickness: string };
  baseSize: { length: string; width: string; height: string };
  flowerBedSize: { length: string; width: string; thickness: string };
  sketchFile: File | null;
}

export interface Decoration {
  portraitType: string;
  portraitSize: string;
  inscription: string;
  dates: string;
  epitaph: string;
  decor: string;
  font: string;
  approveLayoutWithClient: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  selected: boolean;
  price: number;
}

export interface OrderItem {
  id: string;
  name: string;
  size: string;
  material: string;
  quantity: number;
  price: number;
  total: number;
}

export interface PaymentInfo {
  productPrice: number;
  decorationPrice: number;
  discount: number;
  prepayment: number;
  paymentMethod: string;
  total: number;
  paid: number;
  remaining: number;
}

export type OrderFiles = Record<string, File[]>;

export interface OrderFormData {
  customer: Customer;
  burialPlace: BurialPlace;
  product: MonumentProduct;
  decoration: Decoration;
  services: ServiceItem[];
  items: OrderItem[];
  payment: PaymentInfo;
  files: OrderFiles;
  status: "draft" | "created";
  createdAt: string;
}
