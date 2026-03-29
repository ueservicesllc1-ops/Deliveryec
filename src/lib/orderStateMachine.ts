// ─────────────────────────────────────────────────────────────────────────────
// ORDER STATE MACHINE  –  Single source of truth for Seller, KDS & Driver
// ─────────────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'created'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'driver_assigned'
  | 'driver_arrived'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'completed'
  | 'cancelled';

// ── Human-readable labels ─────────────────────────────────────────────────────
export const STATUS_LABELS: Record<OrderStatus, string> = {
  created:          'Nuevo',
  accepted:         'Aceptado',
  preparing:        'En cocina',
  ready_for_pickup: 'Listo para retiro',
  driver_assigned:  'Driver asignado',
  driver_arrived:   'Driver llegó',
  picked_up:        'Recogido',
  on_the_way:       'En camino',
  delivered:        'Entregado',
  completed:        'Completado',
  cancelled:        'Cancelado',
};

// ── Color per status ──────────────────────────────────────────────────────────
export const STATUS_COLORS: Record<OrderStatus, string> = {
  created:          '#F59E0B',
  accepted:         '#FF6A00',
  preparing:        '#FF5722',
  ready_for_pickup: '#22C55E',
  driver_assigned:  '#3B82F6',
  driver_arrived:   '#06B6D4',
  picked_up:        '#8B5CF6',
  on_the_way:       '#A855F7',
  delivered:        '#10B981',
  completed:        '#6B7280',
  cancelled:        '#EF4444',
};

// ── Visibility rules per panel ────────────────────────────────────────────────

/** Which statuses the SELLER PANEL shows (never hides after driver accepts) */
export const SELLER_VISIBLE_STATUSES: OrderStatus[] = [
  'created', 'accepted', 'preparing',
  'ready_for_pickup', 'driver_assigned', 'driver_arrived',
  'picked_up', 'on_the_way', 'delivered', 'completed', 'cancelled',
];

/** Which statuses are shown as "active" (non-historical) in the Seller Panel */
export const SELLER_ACTIVE_STATUSES: OrderStatus[] = [
  'created', 'accepted', 'preparing',
  'ready_for_pickup', 'driver_assigned', 'driver_arrived',
  'picked_up', 'on_the_way',
];

/** Which statuses the KDS shows */
export const KDS_ACTIVE_STATUSES: OrderStatus[] = ['accepted', 'preparing'];
export const KDS_DONE_STATUSES: OrderStatus[]   = [
  'ready_for_pickup', 'driver_assigned', 'driver_arrived',
  'picked_up', 'on_the_way', 'delivered', 'completed',
];

/** Which statuses the DRIVER sees as available (unassigned offers) */
export const DRIVER_OFFER_STATUSES: OrderStatus[] = ['ready_for_pickup'];

/** Which statuses mean the driver has an active delivery */
export const DRIVER_ACTIVE_STATUSES: OrderStatus[] = [
  'driver_assigned', 'driver_arrived', 'picked_up', 'on_the_way',
];

// ── Valid transitions ─────────────────────────────────────────────────────────
// Panel → nextStatus
export const SELLER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  created:          'accepted',      // Seller accepts order
  accepted:         'preparing',     // Seller sends to kitchen
  preparing:        'ready_for_pickup', // Kitchen marks ready (also done from KDS)
  driver_arrived:   'picked_up',     // Seller confirms handoff to driver
};

export const KDS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  accepted:   'preparing',        // KDS marks as being cooked
  preparing:  'ready_for_pickup', // KDS marks as ready → triggers driver broadcast
};

export const DRIVER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  ready_for_pickup: 'driver_assigned', // Driver accepts offer
  driver_assigned:  'driver_arrived',  // Driver marks arrival at restaurant
  driver_arrived:   'picked_up',       // Driver confirms pickup (after seller handoff)
  picked_up:        'on_the_way',      // Driver starts navigation
  on_the_way:       'delivered',       // Driver marks as delivered
  delivered:        'completed',       // Final confirmation
};

// ── Helper: timestamp field per transition ────────────────────────────────────
export const TIMESTAMP_FIELDS: Partial<Record<OrderStatus, string>> = {
  accepted:         'acceptedAt',
  preparing:        'preparingAt',
  ready_for_pickup: 'readyAt',
  driver_assigned:  'driverAssignedAt',
  driver_arrived:   'driverArrivedAt',
  picked_up:        'pickedUpAt',
  on_the_way:       'onTheWayAt',
  delivered:        'deliveredAt',
  completed:        'completedAt',
  cancelled:        'cancelledAt',
};

// ── Seller tab groups ─────────────────────────────────────────────────────────
export type SellerTab = 'all' | 'new' | 'kitchen' | 'driver' | 'history' | 'cancelled';

export function getSellerTab(status: OrderStatus | string | undefined): SellerTab {
  // ── Legacy status backward compatibility ──────────────────────────────────
  // Old statuses that may still exist in Firestore documents
  if (!status || status === 'paid' || status === 'new') return 'new';  // → created
  if (status === 'cooking')                              return 'kitchen'; // → preparing
  if (status === 'ready')                               return 'kitchen'; // → ready_for_pickup
  if (status === 'dispatched')                          return 'history';  // → on_the_way/delivered
  // ── New state machine ─────────────────────────────────────────────────────
  if (status === 'cancelled')                                              return 'cancelled';
  if (['delivered', 'completed'].includes(status))                        return 'history';
  if (['driver_assigned','driver_arrived','picked_up','on_the_way'].includes(status)) return 'driver';
  if (['accepted','preparing','ready_for_pickup'].includes(status))       return 'kitchen';
  if (status === 'created')                                               return 'new';
  return 'all';
}

export function filterBySellerTab(orders: any[], tab: SellerTab): any[] {
  if (tab === 'all') return orders;
  return orders.filter(o => getSellerTab(o.status as OrderStatus) === tab);
}
