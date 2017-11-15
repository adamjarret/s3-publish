const Progress = require('progress');

class ProgressBar
{
    constructor(bytesToTransfer, remainingKeys, sizeToString)
    {
        this.startDate = new Date();

        this.remainingKeys = remainingKeys;

        this.sizeToString = sizeToString || ((n) => n + '');

        this.bar = new Progress('Completed :_current/:_total (:_rate/s) with :_remain remaining (ETA: :etas)', {
            total: bytesToTransfer,
            //width: 20,
            //incomplete: ' ',
            clear: true
        });

        this.tick = this._tick.bind(this);
    }

    interrupt(msg)
    {
        this.bar.interrupt(msg);
    }

    isComplete()
    {
        return this.bar.complete;
    }

    _tick(byteLength)
    {
        const {bar, startDate, remainingKeys, sizeToString} = this;
        const elapsedSeconds = Math.max((new Date - startDate) / 1000, 1);
        bar.tick(byteLength, {
            '_current': sizeToString(bar.curr, ''),
            '_total': sizeToString(bar.total),
            '_rate': sizeToString(Math.round(bar.curr / elapsedSeconds)),
            '_remain': remainingKeys,
        });
    }
}

module.exports = ProgressBar;