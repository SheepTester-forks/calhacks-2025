#!/usr/bin/env python3

"""
Source of queries to test
"""

queries = [
    {
        "select": ["day", {"SUM": "bid_price"}],
        "from": "events",
        "where": [ {"col": "type", "op": "eq", "val": "impression"} ],
        "group_by": ["day"],
    },
    {
        "select": ["publisher_id", {"SUM": "bid_price"}],
        "from": "events",
        "where": [
            {"col": "type", "op": "eq", "val": "impression"},
            {"col": "country", "op": "eq", "val": "JP"},
            {"col": "day", "op": "between", "val": ["2024-10-20", "2024-10-23"]}
        ],
        "group_by": ["publisher_id"],
    },
    {
        "select": ["country", {"AVG": "total_price"}],
        "from": "events",
        "where": [{"col": "type", "op": "eq", "val": "purchase"}],
        "group_by": ["country"],
        "order_by": [{"col": "AVG(total_price)", "dir": "desc"}]
    },
    {
        "select": ["advertiser_id", "type", {"COUNT": "*"}],
        "from": "events",
        "group_by": ["advertiser_id", "type"],
        "order_by": [{"col": "COUNT(*)", "dir": "desc"}]
    },
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
]