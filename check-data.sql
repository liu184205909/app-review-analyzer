SELECT id, status, platform, appStoreId, result::text
FROM "AnalysisTask"
ORDER BY createdAt DESC
LIMIT 5;