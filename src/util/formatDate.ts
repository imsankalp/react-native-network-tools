const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);

  const pad = (num: number) => ('0' + num).slice(-2);

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export default formatDate;
