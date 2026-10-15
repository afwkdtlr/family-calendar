export function FamilyCoverField({ family, disabled, uploading, onPick }) {
  return (
    <div className="family-cover-field">
      <div className="family-cover-row">
        <div
          className="family-cover-preview"
          style={family.backgroundUrl ? { backgroundImage: `url("${family.backgroundUrl}")` } : undefined}
        >
          {!family.backgroundUrl && <span>아직 사진이 없어요</span>}
        </div>
        <div className="family-cover-copy">
          <strong>{family.name} 배경</strong>
          <p className="muted">로그인할 때 이 사진이 먼저 보여요. 그룹장만 바꿀 수 있습니다.</p>
        </div>
      </div>
      <p className="family-cover-hint">
        올리기 전에 확인해 주세요. 핸드폰으로 찍은 <b>세로 사진</b>이 로그인 화면에 가장 잘 맞습니다. 가로 사진은 양옆이 잘릴 수 있어요.
      </p>
      <label className="ghost-btn chip-btn family-cover-btn">
        {uploading ? "올리는 중..." : family.backgroundUrl ? "사진 바꾸기" : "사진 올리기"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          disabled={disabled || uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) {
              onPick(file);
            }
          }}
        />
      </label>
    </div>
  );
}
