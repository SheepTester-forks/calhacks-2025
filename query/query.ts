// Let's assume the aggregate functions are only used on prices (because why
// would they be used for the other columns?)

type Query = {
  select: Column[];
  from: 'events';
  where: Condition[];
  /** column names */
  group_by?: string[];
  order_by?: {
    /**
     * may also be SUM(bid_price | total_price), AVG(bid_price | total_price),
     * COUNT(*)
     */
    col: QuantitativeColumn | `${'SUM' | 'AVG'}(${PriceColumn})`;
    dir: 'asc' | 'desc';
  }[];
};

/**
 * I expect SUM/AVG to only be used on these two because it doesn't make sense
 * to use on timestamps
 */
type PriceColumn = 'bid_price' | 'total_price';
/**
 * I expect these to be used in numerical WHERE conditions like lt, lte, gt,
 * gte, and between because it doesn't make sense to use on IDs.
 */
type QuantitativeColumn =
  | 'ts'
  | 'week'
  | 'day'
  | 'hour'
  | 'minute'
  | PriceColumn;
/**
 * Any column. Includes the IDs and enums. Can be used for eq, neq, and in.
 */
type AnyColumn =
  | QuantitativeColumn
  | 'auction_id'
  | 'advertiser_id'
  | 'publisher_id'
  | 'type'
  | 'country';

/**
 * string -> column name
 *
 * object -> aggregate function
 */
type Column =
  | AnyColumn
  | { COUNT: '*' }
  | { SUM: PriceColumn }
  | { AVG: PriceColumn };

type Condition =
  | { op: 'eq' | 'neq'; col: AnyColumn; val: string }
  | { op: 'lt' | 'lte' | 'gt' | 'gte'; col: QuantitativeColumn; val: string }
  | { op: 'in'; col: AnyColumn; val: string[] }
  | {
      op: 'between';
      col: QuantitativeColumn;
      val: [low: string, high: string];
    };
