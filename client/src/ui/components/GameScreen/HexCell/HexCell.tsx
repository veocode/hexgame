import React from 'react';
import { HexCellHightlightType, HexMapCell } from '../../../../shared/hexmapcell';
import './HexCell.css';


interface HexCellProps {
  id: number,
  cell: HexMapCell,
  playerColors: { [key: number]: string },
  onClick: (id: number) => void
};

export const HexCell: React.FC<HexCellProps> = (props) => {

  const { id, cell, onClick } = props;
  const hexClass: string = cell.isNone() ? 'none' : 'empty';

  let highlight = null;
  let occupant = null;

  if (cell.isHighlighted()) {
    let highlightClass;
    switch (cell.getHighlightType()) {
      case HexCellHightlightType.Center: highlightClass = 'white'; break;
      case HexCellHightlightType.Near: highlightClass = 'green'; break;
      case HexCellHightlightType.Far: highlightClass = 'orange'; break;
    }

    highlight = <div className={`hex-child highlight highlight-${highlightClass}`}></div>;
  }

  if (cell.isOccupied() || cell.isFreed()) {
    const occupantTag = cell.getOccupiedBy();
    const occupantClass = occupantTag ? props.playerColors[occupantTag] : 'red';
    const occupantTypeClass = cell.isFreed() ? '-leave' : '';
    occupant = <div className={`hex-child occupant${occupantTypeClass} occupant-${occupantClass}`}></div>
  }

  return (
    <div className={`hex hex-${hexClass}`} onClick={() => onClick(id)}>
      {occupant}
      {highlight}
    </div>
  );
}
