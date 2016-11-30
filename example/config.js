module.exports = {
    logger: {
        logFiles: [
            {
                type: 'track',
                route: ['/track.htm', '/timetrack.htm'],
                appenders: [
                    {
                        "type": "file",
                        "filename": "track.log",
                        "category": "track",
                        "level": "LOG",
                        "layout": {
                            "type": "messagePassThrough"
                        }
                    }
                ]
            }
        ],
        replaceConsole: true
    },
    monitor: {
        'prefix': 'Bigpipe',
        'env': {
            'production': {
                host: 'qmon-fe.corp.qunar.com',
                port: 2013,
                category: 's.fe.',
                rate: 1
            },
            'default': {
                host: 'qmon-beta.corp.qunar.com',
                port: 2013,
                category: 't.shadow.test.fe.',
                rate: 5
            }
        }
    }
};