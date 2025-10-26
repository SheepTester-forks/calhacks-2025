use clap::Parser;
use serde::Deserialize;
use std::error::Error;
use std::fs::File;
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Path to the input CSV file
    #[arg(short, long)]
    file: PathBuf,
}

#[derive(Debug, Deserialize)]
struct Event {
    /// Minutes since Unix epoch, though in the CSV it's represented in
    /// milliseconds
    #[serde(rename = "ts")]
    timestamp: u64,
    #[serde(rename = "type")]
    event_type: EventType,
    /// 16 bytes -> 2 u64s (right?) -> now a string since it's a UUID
    auction_id: String,
    /// 4 digits at most it seems
    advertiser_id: u16,
    /// 4 digits at most it seems
    publisher_id: u16,
    /// in ten-thousandths of a dollar. but f64 for compatibility
    bid_price: Option<f64>,
    /// at most 6 digits
    user_id: u32,
    /// in ten-thousandths of a dollar. but f64 for compatibility
    total_price: Option<f64>,
    country: Country,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
enum EventType {
    Serve,
    Impression,
    Click,
    Purchase,
}

#[derive(Debug, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "UPPERCASE")]
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

fn main() -> Result<(), Box<dyn Error>> {
    let args = Args::parse();
    let file = File::open(args.file)?;
    let mut rdr = csv::Reader::from_reader(file);

    let mut count = 0;
    for result in rdr.deserialize() {
        let _record: Event = result?;
        count += 1;
        if count % 100_000 == 0 {
            println!("Processed {} records", count);
        }
    }
    println!("Finished processing {} records.", count);

    Ok(())
}