import React from 'react';
import styles from './ProcessGroupSelector.module.css';

interface ProcessGroupSelectorProps {
    value: string;
    onChange: (value: string) => void;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
}

const processGroups = [
    'all',
    'initiating',
    'planning',
    'executing',
    'monitoring_and_controlling',
    'closing'
];

export const ProcessGroupSelector: React.FC<ProcessGroupSelectorProps> = ({
    value,
    onChange,
    onValueChange,
    disabled = false
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        if (onValueChange) {
            onValueChange(newValue);
        }
    };

    return (
        <div className={styles.container}>
            <label className={styles.label} htmlFor="processGroup">
                Process Group
            </label>
            <div className={styles.selectWrapper}>
                <select
                    id="processGroup"
                    className={styles.select}
                    value={value}
                    onChange={handleChange}
                    disabled={disabled}
                >
                    {processGroups.map((group) => (
                        <option key={group} value={group}>
                            {group.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default ProcessGroupSelector; 