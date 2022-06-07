import React from 'react';
import { HexMapCell } from '../../../game/hexmapcell';
import { HexCell } from '../HexCell/HexCell';
import './HexField.css';


interface HexFieldProps {
  width: number,
  height: number,
  cells: HexMapCell[],
  onCellClick: (id: number) => void
};

export const HexField: React.FC<HexFieldProps> = (props) => {
  let index: number = 0;
  const rows: JSX.Element[] = [];

  for (let row = 1; row <= props.height; row++) {
    const hexes: JSX.Element[] = [];
    for (let col = 1; col <= props.width; col++) {
      hexes.push(
        <HexCell key={index++} id={index} cell={props.cells[index]} onClick={id => props.onCellClick(id)} />
      )
    }

    rows.push(<div key={row} className='row'>{hexes}</div>)
  }

  return (
    <div className='hex-field'>
      {rows}
    </div>
  );

}
