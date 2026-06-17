export type CustomerSessionResponse = {
  sessionToken: string;
  session: {
    id: number;
    restaurantId: number;
    tableId: number;
    status: string;
  };
  restaurant: {
    id: number;
    name: string;
    description: string | null;
    address: string | null;
  };
  table: {
    id: number;
    tableNumber: string;
    qrCodeToken: string;
    isActive: boolean;
  };
};
