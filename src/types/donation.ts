import type { Donation } from './entities';
import type { PaginatedResponse } from './api';

export interface DonationsResponse extends PaginatedResponse<Donation> {
  aggregate: {
    totalAmount: number;
  };
}