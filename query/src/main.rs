struct Event {
    timestamp: u64,
    event_type: EventType,
    /// 16 bytes -> 2 u64s (right?)
    auction_id: [u64; 2],
    /// 4 digits at most it seems
    advertiser_id: u16,
    /// 4 digits at most it seems
    publisher_id: u16,
    /// in ten-thousandths of a dollar
    bid_price: u32,
    /// at most 6 digits
    user_id: u32,
    /// in ten-thousandths of a dollar
    total_price: u32,
    country: Country,
}

enum EventType {
    Serve,
    Impression,
    Click,
    Purchase,
}

enum Country {
    US,
    IN,
    AU,
    CA,
    DE,
    GB,
    ES,
    KR,
    BR,
    FR,
    JP,
    MX,
}

fn main() {
    println!("Hello, world!");
}
