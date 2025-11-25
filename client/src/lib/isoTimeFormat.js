const isoTimeFormat = (dateTime) => {
    const date = new Date(dateTime);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

export default isoTimeFormat;