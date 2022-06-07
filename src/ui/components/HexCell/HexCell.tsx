import React from 'react';
import { HexCellHightlightType, HexMapCell } from '../../../game/hexmapcell';
import './HexCell.css';


interface HexCellProps {
  id: number,
  cell: HexMapCell,
  onClick: (id: number) => void
};

export const HexCell: React.FC<HexCellProps> = (props) => {

  const hexClass: string = props.cell.isEmpty() ? 'empty' : 'none';
  let highlight = null;

  if (props.cell.isHighlighted()) {
    const highlightType = props.cell.getHighlightType();
    const highlightClass = highlightType === HexCellHightlightType.Near ? 'green' : 'orange';
    highlight = <div className={`highlight highlight-${highlightClass}`}></div>;
  }

  return (
    <div className={`hex hex-${hexClass}`} onClick={() => props.onClick(props.id)}>{props.id}
      {highlight}
    </div>
  );
}
