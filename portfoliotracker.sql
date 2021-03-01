CREATE DATABASE portfoliotracker;
USE portfoliotracker;

CREATE TABLE marketvalue(
    DataTime DATETIME NOT NULL,
    MarketType VARCHAR(16),
    MarketAbbr VARCHAR(16) NOT NULL FOREIGN KEY REFERENCES markets(MarketAbbr),
    CurrencyAbbr VARCHAR(16) NOT NULL,
    Value FLOAT NOT NULL,
);

CREATE TABLE markets(
    MarketType VARCHAR(16),
    MarketAbbr VARCHAR(16) NOT NULL,
    MarketName VARCHAR(255),
    CONSTRAINT PK_Market PRIMARY KEY (MarketType, MarketAbbr)
);

CREATE TABLE users(
    UserID INT NOT NULL AUTO_INCREMENT,
    FirstName VARCHAR(100),
    LastName VARCHAR(100),
    Email VARCHAR(255),
    CONSTRAINT PK_User PRIMARY KEY (UserID)
);

CREATE TABLE portfoliocontent(
    ContentID INT NOT NULL AUTO_INCREMENT,
    UserID INT NOT NULL,
    MarketType VARCHAR(16),
    MarketAbbr VARCHAR(16) NOT NULL,
    IsHeld BOOL NOT NULL DEFAULT 1,
    Amount FLOAT NOT NULL,
    BuyPrice FLOAT NOT NULL,
    CONSTRAINT PK_Content PRIMARY KEY (ContentID),
    FOREIGN KEY (UserID) REFERENCES users(UserID),
    FOREIGN KEY (MarketType, MarketAbbr) REFERENCES markets(MarketType, MarketAbbr)
)