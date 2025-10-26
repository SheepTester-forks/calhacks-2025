# Query Planner Challenge

https://docs.google.com/document/d/1k1J3HrCThfZyI2PdwgSOwGpT0Vt8Wv_QPhexhhZSatE/edit?tab=t.0

## Overview

Every day, more than **1.6 billion people** in the world will see an **AppLovin ad** – which means behind the scenes, we’re processing and **optimizing against massive volumes** of data. Impressions, installs, purchases, bids – all of it needs to be queried, aggregated, and analyzed across numerous dimensions, fast. 

Your challenge is about stepping into that world of large-scale data analytics. 

### Your Goal

Optimize a database system to retrieve and process **smarter and faster** than a provided DuckDB baseline. Your objective isn’t only to be faster – it is to **demonstrate how** your design choices in storage layout, indexing, query planning lead to better performance. 

You’ll receive a \~20 GB dataset and a set of simple SQL-like queries.

Your solution should run in **two phases**:

* **Prepare phase** – You’re given the dataset. You may load, index, transform, or pre-aggregate it in any way to create your optimized data store or indexes. 

* **Run phase** – Once queries are provided, your solution must execute them and output correct results. No outbound network access should happen during this phase.

### The Challenge

Turn raw event data into **lightning-fast insights,** showing not only that your system runs quickly, but that its **query planning and physical design choices** are sound. 

Anything goes — DB restructuring, aggregations, intelligent query planning, indexes, caching layers — as long as it all runs self-contained (without network access to 3rd parties)

## Evaluation

Please submit all related code, as well as documentation that shows your architecture \+ performance on the provided benchmark queries. Please also submit instructions so the judges can run your results locally

The judges will run your solution on a separate set of queries. They will be of the same type of queries you have done your benchmark against. Judges will be running on a MacBook M2 with Apple Silicon, meaning your solution cannot require more than 16 GB RAM or 100 GB Disk usage

Submissions will be judged on the following criteria:

**Performance and Accuracy (40%)**

- Speed of execution on holdout datasets		20%  
- Clear benchmarking					20%

	Each incorrect query will deduct 5% from your score for this category,   
up to the max 40%

**Technical Depth (30%)**

- Quality of your database system			20%  
- Sound architectural decisions				10%

**Creativity (20%)**

- Novel or elegant approach 				20%

**Documentation and Clarity (10%)**

- Clear and concise presentation of results 		10%

## Details

Inside this Google Drive folder, you have been given simulated **ad event data** representing the lifecycle of real-time auctions in a digital advertising system in the year 2024\. Each row represents a single event (e.g., an impression, click, or purchase) tied to a specific :

- advertiser (the one buying the ad),   
- user (the one seeing / clicking on the ad), and  
- publisher (the one who is getting paid to show the ad)

This table stores the subset of fields you will be working with

| Column | Type | Description | Notes |
| ----- | ----- | ----- | ----- |
| **ts** | `long` (Unix timestamp, milliseconds) | The precise time the event occurred. | You can convert it to a human-readable datetime for analysis. Events in a single auction (same `auction_id`) will have increasing timestamps. |
| **type** | `ENUM {serve, impression, click, purchase}` | The kind of event represented by the row. | These types represent a typical ad funnel:  • `serve`: ad was served to a user (ad load) • `impression`: ad was displayed • `click`: user clicked the ad • `purchase`: user made a purchase following the click |
| **auction\_id** | `UUID` | Unique identifier of the auction associated with this event. | All events sharing the same `auction_id` represent the same ad auction lifecycle. Useful for joins, aggregations, and funnel analysis. |
| **advertiser\_id** | `int` | Identifier for the advertiser who placed the ad. | Use this to group performance metrics by advertiser. |
| **publisher\_id** | `int` | Identifier for the publisher (app or site) where the ad was displayed. | Useful for see app monetization |
| **bid\_price** | `float` | The price (in USD) that the advertiser bid in the auction. In this case, this is the same as what the publisher is paid to show the ad | Only present on `impression` events. May be `NULL` or 0 for other types. For example, being $0.05 means the advertiser paid the publisher $0.05 to show the ad |
| **user\_id** | `int` | Anonymized identifier of the user who interacted with the ad. | Ties together events from the same user across auctions. |
| **total\_price** | `float` | The total amount (in USD) of the purchase made by the user. | Only present on `purchase` events. May be `NULL` or 0 otherwise. |
| **country** | `string` (ISO 3166-1 alpha-2 code) | The country in which the event occurred. | e.g., `US`, `JP`, `DE`, `IN`. Useful for geographic breakdowns. |

Example rows:

```csv
ts,type,auction_id,advertiser_id,publisher_id,bid_price,user_id,total_price,country
1717932870000,serve,7e20d44b-c9ea-43be-8a01-21783a8b3c13,148,863,,654572,,US
1718295770000,serve,6a39fd70-cfdf-4e69-b4be-49339729511a,849,143,,839749,,US
1718295773254,impression,6a39fd70-cfdf-4e69-b4be-49339729511a,849,143,6.4621,839749,,US
1707075869881,click,b8eee04f-d4de-4897-bac8-00f0a00f2006,1486,180,,452984,,US
1707077326627,purchase,b8eee04f-d4de-4897-bac8-00f0a00f2006,1486,180,,452984,104.35,US
```

The rows live in data/events_part_XXXXX.csv starting from 00000.

## Data Loading

Sample data according to this schema has been generated in CSVs and compressed in `data.zip`. This is the entire data we will be working with during this exercise, for both the `prepare` and `run` phases, as well as during judging evaluation. Attached as well is `data-lite.zip` which is a 1 GB (after uncompressed) datasource which you may find helpful for prototyping or if hackathon internet speeds are poor. However, performance will ultimately be measured on the full 20 GB dataset (after uncompressed). Submissions will be evaluated against the exact same `data.zip` as provided above

## Queries

To simplify the challenge, we have simplified a query’s structure, as well as the operations supported. Queries will be passed in a JSON structure described below  
**Note: The code attached has logic to translate this to SQL for you, though your solution may find it more beneficial to operate on the JSON structure itself**

### Structure

```
{
  "select": [...],
  "from": "events",
  "where": [...],
  "group_by": [...],
  "order_by": [...]
}
```

### Supported Functionality

The following operators and clauses are guaranteed to appear — this list is **exhaustive** for the challenge:

`SELECT` 

A list of columns and/or aggregate functions to retrieve.

Each element in the list can be:

- A **string** representing a column name, e.g. `"publisher_id"`, `"country"`, `"type"`  
- An **object** representing an aggregate function, e.g. `{"SUM": "bid_price"}`, `{"COUNT": "*"}`, `{"AVG": "total_price"}`  
- Columns will be projected by its name, i.e. `SUM(bid_price)` 

`FROM` 

Always the string `"events"` for this challenge. This does not need to be the physical table you use if you choose to partition the data, but will be the virtual table exposed to the user

`WHERE` 

Contains a list of condition objects, with each of format:

```
{
  "col": "<column_name>",
  "op": "<operator>", -- "eq", "neq", "in", or "between" 
  "val": "<value or list>"
}
```

 *Notes:*

* Multiple conditions in `where` should be treated as **AND**\-combined.  
* Values may be strings, numbers, or date-like strings depending on the column.  
* No nested conditions (e.g., OR, NOT) will appear


`GROUP BY` 

One or more comma separated columns

Grouping columns must appear in the `select` list if non-aggregated.

`ORDER BY`

	Optional list of sorting instructions of format:

```
{
  "col": "<column name>",
  "dir": "<direction>" -- Either "asc" or "desc"
}
```

You **do not need to support** joins, nested queries, or sub-selects (though you may use joins for underlying partitions or aggregations if needed).

**Note:**  the queries assume some simple aggregations exist, like by ability to reference “day” (ex. 2024-01-02), “week” (ex. 2024-01-01 (A monday, first day of week) ), “hour” (ex. 2024-01-02 02:00) or “minute” (ex. 2024-01-02 03:11)

### Examples

Below are some example queries. In this Google Drive are the expected responses for them in `results/`

**What is the revenue generated on our ad platform each day?**

```json
{
  "select": ["day", {"SUM": "bid_price"}],
  "from": "events",
  "where": [ {"col": "type", "op": "eq", "val": "impression"} ],
  "group_by": ["day"],
}
```

**Which publishers made the most money in Japan between 2024-10-20 and 2024-10-23?** 

```
{
  "select": ["publisher_id", {"SUM": "bid_price"}],
  "from": "events",
  "where": [ 
	{"col": "type", "op": "eq", "val": "impression"},
{"col": "country", "op": "eq", "val": "JP"},
{"col": "day", "op": "between", "val": ["2024-10-20", "2024-10-23"]} 
   ],
  "group_by": ["publisher_id"],
}
```

**What is the average purchase value by country (all time)?**

```
{
  "select": ["country", {"AVG": "total_price"}],
  "from": "events",
  "where": [{"col": "type", "op": "eq", "val": "purchase"}],
  "group_by": ["country"],
  "order_by": [{"col": "AVG(total_price)", "dir": "desc"}]
}
```

**How many events have been seen for each advertiser for each type?**

```
{
  "select": ["advertiser_id", "type", {"COUNT": "*"}],
  "from": "events",
  "group_by": ["advertiser_id", "type"],
  "order_by": [{"col": "COUNT(*)", "dir": "desc"}]
}
```

**What is the total amount spent on 2024-06-01, broken down by minute?** 

```
{
  "select": ["minute", {"SUM": "bid_price"}],
  "from": "events",
  "where": [
	{"col": "type", "op": "eq", "val": "impression"},
{"col": "day", "op": "eq", "val": "2024-06-01"}
   ],
  "group_by": ["minute"],
  "order_by": [{"col": "minute", "dir": "asc"}]
 }
```

## Starter Code

We have given you some starter code that includes a simple baseline using DuckDB ([https://duckdb.org/docs/stable/clients/python/overview](https://duckdb.org/docs/stable/clients/python/overview)) in Python.

You can find it in `baseline.zip`.   
The DuckDB library contains starter logic to load the CSV dataset, load the JSON queries, and run them directly against the DuckDB engine without any additional processing. It outputs to console the timed results

## Final Thoughts

This challenge is about coming up with creative and effective solutions to a traditional data retrieval problem. Surprise us with creative solutions and set no limit for how performant you can go. The magic is in the details.

Good luck\!
