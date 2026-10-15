export function FamilyWelcome({ url, name, onDone }) {
  return (
    <button className="family-welcome" type="button" onClick={onDone}>
      <img src={url} alt="" />
      <div className="family-welcome-copy">
        <p>{name || "우리 가족"}</p>
        <span>화면을 눌러 캘린더로</span>
      </div>
    </button>
  );
}
