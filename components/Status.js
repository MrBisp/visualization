export function Status({ status }) {
    switch (status) {
        case 'completed':
            return <span className="text-green-600">✓ Complete</span>;
        case 'processing':
            return (
                <span className="text-primary">
                    <span className="loading loading-spinner loading-sm mr-2" />
                    Processing
                </span>
            );
        case 'failed':
            return <span className="text-red-600">Failed</span>;
        default:
            return <span className="text-gray-400">Pending</span>;
    }
} 