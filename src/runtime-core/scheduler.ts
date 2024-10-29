const queue: any[] = []
let isFlushPending = false
const p = Promise.resolve()

export function nextTick(fn: any) {
    return fn ? p.then(fn) : p
}

export function queueJobs(job: any) {
    if (!queue.includes(job)) {
        queue.push(job)
    }
    queueFlush()
}

function queueFlush() {
    if (isFlushPending) return

    nextTick(flushJobs)
}

function flushJobs() {
    isFlushPending = true
    let job
    while ((job = queue.shift())) {
        job && job()
    }
}
