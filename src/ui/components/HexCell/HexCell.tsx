import React, { DOMElement, MouseEventHandler } from 'react';
import './HexCell.css';


interface HexCellProps {
  id: number,
  type: number,
  onClick: (id: number) => void
};

export const HexCell: React.FC<HexCellProps> = (props) => {
  const classes: { [key: number]: string } = {
    0: 'none',
    1: 'empty',
    2: 'red',
    3: 'blue'
  }

  return (
    <div className={`hex hex-${classes[props.type]}`} onClick={() => props.onClick(props.id)}></div>
  );
}
