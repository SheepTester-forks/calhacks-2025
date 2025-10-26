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
    #[serde(rename = "ts")]
    timestamp: u64,
    #[serde(rename = "type")]
    event_type: EventType,
    auction_id: String,
    advertiser_id: u16,
    publisher_id: u16,
    bid_price: Option<f64>,
    user_id: u32,
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