# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-23

### Added

- Batch streaming API for processing multiple CSV files in a single operation
  - `parseBatchStream(files)` - AsyncGenerator yielding batch events (file_start, headers, row, file_complete, batch_complete)
  - `parseBatchStreamToArray(files)` - Helper to collect all batch results into arrays
  - `BatchCsvFileInput` type for batch file input (filename + content)
  - `BatchCsvStreamEvent` type for typed batch event handling
  - `BatchParsedCsvFile` type for parsed file results
- Progress tracking per file with row counts
- Error isolation: one file failing doesn't stop the batch
- Yields control to main thread between files for UI responsiveness

### Performance

- Memory-efficient sequential file processing
- Maintains streaming throughput across batch operations

## [1.0.0] - 2025-12-20

### Added

- RFC 4180 compliant CSV parsing with state machine implementation
- Streaming parser API (`parseStream`, `parseBufferStream`, `parseStreamToArray`) for memory-efficient processing of large files
- Automatic delimiter detection (comma, semicolon, tab, pipe)
- Automatic encoding detection (UTF-8, UTF-16 LE/BE, Windows-1252, ISO-8859-1)
- CSV generation functions (`generate`, `generateFromObjects`, `generateRow`, `createGenerator`)
- Header parsing with automatic record creation
- Support for:
  - Quoted fields with proper escaping
  - Multiline values within quotes
  - Escaped double quotes (`""`)
  - CRLF and LF line endings
  - Field trimming option
  - Row skipping option
- Full TypeScript support with exported types:
  - `CSVDocument`, `ParsedRow`, `ParseOptions`, `StreamOptions`
  - `GenerateOptions`, `ParseResult`, `StreamEvent`
- Zod schemas for runtime validation
- Utility functions:
  - `detectDelimiter` - Auto-detect CSV delimiter
  - `detectEncoding` - Detect buffer encoding
  - `decodeBuffer` - Decode binary buffers
  - `escapeField` - Properly escape fields for CSV output
  - `needsQuoting` - Check if field needs quotes
