import React from 'react';
import styles from './ToolSelector.module.css';
import { toolsArray } from '../../config/toolsarray';

interface ToolSelectorProps {
    value: string;
    onChange: (value: string) => void;
    onToolChange?: (value: string) => void;
    selectedProcessGroup: string;
    selectedKnowledgeArea: string;
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({
    value,
    onChange,
    onToolChange,
    selectedProcessGroup,
    selectedKnowledgeArea
}) => {
    // Helper function to normalize process group names
    const normalizeProcessGroup = (group: string): string => {
        const mapping: { [key: string]: string } = {
            'monitoring_and_controlling': 'Monitoring and Controlling',
            'monitoring and controlling': 'Monitoring and Controlling',
            'monitoring & controlling': 'Monitoring and Controlling'
        };
        return mapping[group.toLowerCase()] || group;
    };

    // Filtering logic with case-insensitive matching
    let filteredTools: string[] = [];
    const normalizedProcessGroup = normalizeProcessGroup(selectedProcessGroup);

    if (selectedProcessGroup === 'all' && selectedKnowledgeArea === 'all') {
        // Show all tools when both filters are 'all'
        filteredTools = Array.from(new Set(toolsArray.map(t => t.Tool)));
    } else if (selectedProcessGroup === 'all') {
        // Filter by knowledge area only
        filteredTools = Array.from(new Set(
            toolsArray
                .filter(t => t['Knowledge Area'].toLowerCase() === selectedKnowledgeArea.toLowerCase())
                .map(t => t.Tool)
        ));
    } else if (selectedKnowledgeArea === 'all') {
        // Filter by process group only
        filteredTools = Array.from(new Set(
            toolsArray
                .filter(t => normalizeProcessGroup(t['Process Group']).toLowerCase() === normalizedProcessGroup.toLowerCase())
                .map(t => t.Tool)
        ));
    } else {
        // Filter by both process group and knowledge area
        filteredTools = Array.from(new Set(
            toolsArray
                .filter(t => 
                    normalizeProcessGroup(t['Process Group']).toLowerCase() === normalizedProcessGroup.toLowerCase() &&
                    t['Knowledge Area'].toLowerCase() === selectedKnowledgeArea.toLowerCase()
                )
                .map(t => t.Tool)
        ));
    }

    // Sort tools and ensure 'all' is first
    filteredTools.sort();
    filteredTools = ['all', ...filteredTools.filter(t => t !== 'all')];

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        if (onToolChange) {
            onToolChange(newValue);
        }
    };

    return (
        <div className={styles.container}>
            <label className={styles.label} htmlFor="tool">
                Tool
            </label>
            <div className={styles.selectWrapper}>
                <select
                    id="tool"
                    className={styles.select}
                    value={value}
                    onChange={handleChange}
                >
                    {filteredTools.map((tool) => (
                        <option key={tool} value={tool}>
                            {tool.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default ToolSelector; 