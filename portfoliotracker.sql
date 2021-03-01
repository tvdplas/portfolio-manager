CREATE DATABASE portfoliotracker;
USE portfoliotracker;

CREATE TABLE marketvalue(
    DataTime DATETIME NOT NULL,
    MarketType VARCHAR(16),
    MarketAbbr VARCHAR(16) NOT NULL FOREIGN KEY REFERENCES markets(MarketAbbr),
    CurrencyAbbr VARCHAR(16) NOT NULL,
    Value FLOAT NOT NULL,

)

CREATE TABLE markets(
    MarketType VARCHAR(16),
    MarketAbbr VARCHAR(16) NOT NULL,
    MarketName VARCHAR(255),
    CONSTRAINT PK_Market PRIMARY KEY (MarketType, MarketAbbr)
)