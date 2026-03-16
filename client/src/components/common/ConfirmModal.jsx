import React from 'react';
import { useTranslation } from 'react-i18next';

const ConfirmModal = ({ show, onConfirm, onCancel, title, message, confirmText, confirmVariant = 'danger' }) => {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="modal-backdrop-custom" onClick={onCancel}>
      <div className="modal-dialog-custom" onClick={e => e.stopPropagation()}>
        <div className="modal-header-custom">
          <div className={`modal-icon-wrap bg-${confirmVariant}-soft`}>
            <i className={`bi bi-exclamation-triangle text-${confirmVariant}`} />
          </div>
          <h5>{title || t('common.confirm_delete')}</h5>
        </div>
        {message && <div className="modal-body-custom"><p>{message}</p></div>}
        <div className="modal-footer-custom">
          <button className="btn btn-light" onClick={onCancel}>{t('common.cancel')}</button>
          <button className={`btn btn-${confirmVariant}`} onClick={onConfirm}>
            {confirmText || t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
