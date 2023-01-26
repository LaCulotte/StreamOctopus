function sendDirect(destinationId, content, id = undefined) {
    let body = {
        type: "direct",
        id: id,
        dst: destinationId,
        content: content
    };

    return fetch("/api/direct", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
}

function sendBroadcast(channel, content, id = undefined) {
    let body = {
        type: "broadcast",
        channel: channel, 
        id: id,
        content: content
    };

    return fetch("/api/broadcast", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
}