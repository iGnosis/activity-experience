export type Logging = {
    level: LogLevel
    debug: boolean
    error: boolean
    info: boolean
    verbose: boolean
}


declare enum LogLevel {
    verbose = 'verbose',
    debug = 'debug',
    info = 'info',
    error = 'error'
}