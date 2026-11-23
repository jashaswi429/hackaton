import { useState } from 'react';
import { cx } from '../../lib/cx';
import { DIGEST_BITS, DIGEST_BYTES, sha256Hex, utf8Bytes } from './hash';
import type { BitRef } from './types';
import styles from './hashlab.module.css';

type DigestPanelProps = {
  text: string;
  digest: Uint8Array;
  hex: string;
  selected: BitRef | null;
  onSelect: (b: BitRef) => void;
};

/** The DIGEST tab: what a fingerprint is made of, byte by byte. */
export function DigestPanel({ text, digest, hex, selected, onSelect }: DigestPanelProps) {
  const [checked, setChecked] = useState(false);

  const inputBytes = utf8Bytes(text).length;
  const chunks = hex.match(/.{1,8}/g) ?? [];

  const handleRecheck = () => {
    // Recompute from scratch and confirm the digest is reproducible.
    const again = sha256Hex(text);
    setChecked(again === hex);
  };

  return (
    <div className={styles.stack}>
      <p className={styles.explain}>
        A hash function maps data of <b>any</b> size to a value of a <b>fixed</b> size.
        SHA-256 always outputs {DIGEST_BITS} bits — {DIGEST_BYTES} bytes, or 64 hex
        characters — no matter whether the input is one letter or a whole file.
      </p>

      <div className={styles.infoGrid}>
        <div className={styles.infoCell}>
          <span className={cx('mono', styles.infoKey)}>INPUT SIZE</span>
          <span className={styles.infoVal}>{inputBytes}</span>
          <span className={cx('mono', styles.infoSub)}>BYTES</span>
        </div>
        <div className={styles.infoCell}>
          <span className={cx('mono', styles.infoKey)}>DIGEST SIZE</span>
          <span className={styles.infoVal}>{DIGEST_BITS}</span>
          <span className={cx('mono', styles.infoSub)}>BITS · ALWAYS</span>
        </div>
        <div className={styles.infoCell}>
          <span className={cx('mono', styles.infoKey)}>BYTES</span>
          <span className={styles.infoVal}>{DIGEST_BYTES}</span>
          <span className={cx('mono', styles.infoSub)}>8 BITS EACH</span>
        </div>
        <div className={styles.infoCell}>
          <span className={cx('mono', styles.infoKey)}>HEX LENGTH</span>
          <span className={styles.infoVal}>64</span>
          <span className={cx('mono', styles.infoSub)}>CHARACTERS</span>
        </div>
      </div>

      <div>
        <div className={styles.panelHead} style={{ marginBottom: 10 }}>
          <span className={cx('mono', styles.panelTitle)}>DIGEST — HEX</span>
          <button type="button" className={styles.ctrl} onClick={handleRecheck}>
            HASH AGAIN
          </button>
        </div>
        <div className={styles.hexBlock} aria-label="Digest in hexadecimal">
          {chunks.map((chunk, i) => (
            <span key={i} className={styles.hexChunk}>
              {chunk}
            </span>
          ))}
        </div>
        {checked && (
          <p className={cx('mono', styles.badge, styles.badgeAccent)} style={{ marginTop: 12, display: 'inline-block' }}>
            ✓ IDENTICAL — THE SAME INPUT REPRODUCES THE SAME DIGEST
          </p>
        )}
      </div>

      <div>
        <span className={cx('mono', styles.fieldLabel)}>DIGEST — BYTE BY BYTE (CLICK TO INSPECT)</span>
        <div className={styles.byteTable} style={{ marginTop: 10 }}>
          {Array.from({ length: DIGEST_BYTES }, (_, i) => (
            <button
              key={i}
              type="button"
              className={cx(styles.byteCell, selected?.byte === i && styles.byteCellOn)}
              onClick={() => onSelect({ byte: i, bit: 0 })}
              aria-label={`Byte ${i}`}
            >
              <span className={cx('mono', styles.byteIdx)}>
                {i.toString(16).padStart(2, '0')}
              </span>
              <span className={cx('mono', styles.byteVal)}>
                {digest[i].toString(16).padStart(2, '0')}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className={cx('mono', styles.note)}>
        THE DIGEST LOOKS RANDOM, BUT IT ISN'T: IT IS A DETERMINISTIC FUNCTION OF THE INPUT.
        NOTHING ABOUT THE OUTPUT REVEALS THE INPUT — AND THAT IS THE POINT.
      </p>
    </div>
  );
}
