
interface StatusIndicatorProps {
  status: 'active' | 'inactive' | 'error' | 'pending' | 'success' | 'failed' | 'completed';
  label?: string;
}

const StatusIndicator = ({ status, label }: StatusIndicatorProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
      case 'success':
      case 'completed':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'error':
      case 'failed':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'error': return 'Error';
      case 'pending': return 'Pending';
      case 'success': return 'Success';
      case 'failed': return 'Failed';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-sm font-medium">
        {label || getStatusText()}
      </span>
    </div>
  );
};

export default StatusIndicator;
