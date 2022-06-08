import React from 'react';
import { HexCellHightlightType, HexMapCell } from '../../../game/hexmapcell';
import { PlayerTag } from '../../../types/utils';
import './HexCell.css';


interface HexCellProps {
  id: number,
  cell: HexMapCell,
  onClick: (id: number) => void
};

export const HexCell: React.FC<HexCellProps> = (props) => {

  const hexClass: string = props.cell.isNone() ? 'none' : 'empty';

  let highlight = null;
  let occupant = null;

  if (props.cell.isHighlighted()) {
    let highlightClass;
    switch (props.cell.getHighlightType()) {
      case HexCellHightlightType.Center: highlightClass = 'white'; break;
      case HexCellHightlightType.Near: highlightClass = 'green'; break;
      case HexCellHightlightType.Far: highlightClass = 'orange'; break;
    }

    highlight = <div className={`hex-child highlight highlight-${highlightClass}`}></div>;
  }

  if (props.cell.isOccupied()) {
    const occupantTag = props.cell.getOccupiedBy();
    const occupantClass = occupantTag === PlayerTag.Player1 ? 'red' : 'blue';
    occupant = <div className={`hex-child occupant occupant-${occupantClass}`}></div>
  }

  return (
    <div className={`hex hex-${hexClass}`} onClick={() => props.onClick(props.id)}>{props.id}
      {highlight}
      {occupant}
    </div>
  );
}
