import React from 'react';
import styles from './KnowledgeAreaSelector.module.css';

interface KnowledgeAreaSelectorProps {
    value: string;
    onChange: (value: string) => void;
    onValueChange?: (value: string) => void;
}

const knowledgeAreas = [
    'all',
    'integration',
    'scope',
    'schedule',
    'cost',
    'quality',
    'resource',
    'communications',
    'risk',
    'procurement',
    'stakeholder'
];

export const KnowledgeAreaSelector: React.FC<KnowledgeAreaSelectorProps> = ({
    value,
    onChange,
    onValueChange
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
            <label className={styles.label} htmlFor="knowledgeArea">
                Knowledge Area
            </label>
            <div className={styles.selectWrapper}>
                <select
                    id="knowledgeArea"
                    className={styles.select}
                    value={value}
                    onChange={handleChange}
                >
                    {knowledgeAreas.map((area) => (
                        <option key={area} value={area}>
                            {area.charAt(0).toUpperCase() + area.slice(1)}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default KnowledgeAreaSelector; 