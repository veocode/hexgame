import React from 'react';
import { JsxChild } from 'typescript';
import './HexField.css';

interface HexFieldProps {
  width: number,
  height: number
};

type HexFieldState = {
  count: number
};

class HexField extends React.Component<HexFieldProps, HexFieldState> {

  state: HexFieldState = {
    count: 0,
  };

  render() {
    let index: number = 0;
    const rows: JSX.Element[] = [];

    for (let row = 1; row <= this.props.height; row++) {
      const hexes: JSX.Element[] = [];
      for (let col = 1; col <= this.props.width; col++) {
        hexes.push(<div className='hex'>#{index++}</div>)
      }

      rows.push(<div className='row'>{hexes}</div>)
    }

    return (
      <div className='hex-field'>
        {rows}
      </div>
    );
  }
}

export default HexField;