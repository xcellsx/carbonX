import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProSubscription } from '../../hooks/useProSubscription';
import ProModal from '../ProModal/ProModal';

/**
 * Component that gates content behind a Pro subscription.
 * Shows ProModal if user is not Pro, otherwise renders children.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to show if user is Pro
 * @param {boolean} props.showModal - Whether to show ProModal (default: true)
 * @param {Function} props.onUpgrade - Callback when user clicks upgrade (default: navigates to settings)
 */
export const ProGate = ({ children, showModal = true, onUpgrade }) => {
  const { isProUser } = useProSubscription();
  const navigate = useNavigate();
  const [showProModal, setShowProModal] = React.useState(false);

  const handleUpgrade = () => {
    setShowProModal(false);
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/settings', { state: { tab: 'billing' } });
    }
  };

  if (isProUser) {
    return <>{children}</>;
  }

  if (showModal) {
    return (
      <>
        <ProModal isOpen={showProModal} onClose={() => setShowProModal(false)} />
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px',
          gap: '1rem'
        }}>
          <p className="medium-regular" style={{ textAlign: 'center', opacity: 0.7 }}>
            This feature requires CarbonX Pro
          </p>
          <button 
            className="default" 
            onClick={() => setShowProModal(true)}
          >
            Upgrade to Pro
          </button>
        </div>
      </>
    );
  }

  return null;
};

/**
 * Hook that returns whether user can access a feature and a function to trigger upgrade modal
 * Useful for conditional rendering without wrapping in ProGate component
 */
export const useProAccess = () => {
  const { isProUser } = useProSubscription();
  const navigate = useNavigate();

  const requirePro = (onUpgrade) => {
    if (!isProUser) {
      if (onUpgrade) {
        onUpgrade();
      } else {
        navigate('/settings', { state: { tab: 'billing' } });
      }
      return false;
    }
    return true;
  };

  return {
    isProUser,
    requirePro,
  };
};
