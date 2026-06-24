function customerRetention(total, repeat) {
    if (total === 0) return 0;
    return ((repeat / total) * 100).toFixed(2);
}