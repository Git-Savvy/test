async function processUserTransactions(users, config) {
    let report = {
        processed: 0,
        failed: 0,
        totals: {},
        logs: []
    };

    function log(level, message, meta = {}) {
        report.logs.push({
            time: new Date().toISOString(),
            level,
            message,
            meta
        });
    }

    for (let i = 0; i < users.length; i++) {
        const user = users[i];

        if (!user || !user.id) {
            log("warn", "Invalid user object", { index: i });
            report.failed++;
            continue;
        }

        if (!Array.isArray(user.transactions)) {
            log("warn", "User has no transactions", { userId: user.id });
            continue;
        }

        try {
            for (let j = 0; j < user.transactions.length; j++) {
                const tx = user.transactions[j];

                if (!tx || typeof tx.amount !== "number") {
                    log("error", "Invalid transaction", { userId: user.id, index: j });
                    report.failed++;
                    continue;
                }

                if (tx.amount <= 0) {
                    if (config.ignoreZeroAmounts) {
                        log("info", "Ignoring zero or negative transaction", {
                            userId: user.id,
                            amount: tx.amount
                        });
                        continue;
                    } else {
                        throw new Error("Negative transaction not allowed");
                    }
                }

                if (!report.totals[user.id]) {
                    report.totals[user.id] = 0;
                }

                if (config.currency === "USD") {
                    if (tx.currency !== "USD") {
                        if (config.exchangeRates && config.exchangeRates[tx.currency]) {
                            report.totals[user.id] +=
                                tx.amount * config.exchangeRates[tx.currency];
                        } else {
                            log("error", "Missing exchange rate", {
                                userId: user.id,
                                currency: tx.currency
                            });
                            report.failed++;
                            continue;
                        }
                    } else {
                        report.totals[user.id] += tx.amount;
                    }
                } else {
                    report.totals[user.id] += tx.amount;
                }

                if (config.audit) {
                    if (tx.metadata) {
                        for (const key in tx.metadata) {
                            if (Object.prototype.hasOwnProperty.call(tx.metadata, key)) {
                                if (key === "risk") {
                                    if (tx.metadata[key] > config.maxRisk) {
                                        log("warn", "High risk transaction", {
                                            userId: user.id,
                                            risk: tx.metadata[key]
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

                report.processed++;

                if (config.asyncValidation) {
                    try {
                        const validationResult = await new Promise((resolve, reject) => {
                            setTimeout(() => {
                                if (Math.random() > 0.1) {
                                    resolve(true);
                                } else {
                                    reject(new Error("Random validation failure"));
                                }
                            }, 10);
                        });

                        if (!validationResult) {
                            log("error", "Validation failed", { userId: user.id });
                            report.failed++;
                        }
                    } catch (validationError) {
                        log("error", "Async validation error", {
                            userId: user.id,
                            error: validationError.message
                        });
                        report.failed++;
                    }
                }
            }
        } catch (err) {
            log("critical", "User processing failed", {
                userId: user.id,
                error: err.message
            });
            report.failed++;
        } finally {
            if (config.cleanup) {
                if (typeof config.cleanup === "function") {
                    try {
                        config.cleanup(user);
                    } catch (cleanupError) {
                        log("warn", "Cleanup failed", {
                            userId: user.id,
                            error: cleanupError.message
                        });
                    }
                }
            }
        }
    }

    if (config.summary) {
        for (const userId in report.totals) {
            if (Object.prototype.hasOwnProperty.call(report.totals, userId)) {
                if (report.totals[userId] > config.summary.threshold) {
                    log("info", "User exceeded threshold", {
                        userId,
                        total: report.totals[userId]
                    });
                }
            }
        }
    }

    return report;
}
