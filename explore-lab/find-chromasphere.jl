using Colors, Base.Iterators, Plots

out_of_gamut(color::RGB) =
  color.r <= 0 || color.g <= 0 || color.b <= 0 ||
  color.r >= 1 || color.g >= 1 || color.b >= 1

function circle_too_big(L, C, res)
  for h in drop(LinRange(0, 360, res+1), 1)
    if out_of_gamut(convert(RGB, LCHab(L, C, h)))
      return true
    end
  end
  false
end

function chromawheel(L, steps, res)
  bot = 0.0
  top = 128.0
  for _ in 1:steps
    mid = (bot + top)/2
    if circle_too_big(L, mid, res)
      top = mid
    else
      bot = mid
    end
  end
  (bot + top) / 2
end

Lpts = [   0.0,   9.2,  73.8,  90.0, 100.0]
Cpts = [   0.0,  10.8,  39.9,  12.5,   0.0]

function appx_chromawheel(L)::Float64
  if L <= 0 || 100 <= L
    return 0
  end
  i = 2
  while Lpts[i] < L && i < 5
    i += 1
  end
  t = (L - Lpts[i-1]) / (Lpts[i] - Lpts[i-1])
  (1-t)*Cpts[i-1] + t*Cpts[i]
end

function show_chromasphere(steps = 16, res = 720)
  Lrange = collect(LinRange(0, 100, 201))
  plot(Lrange, [chromawheel(L, steps, res) for L in Lrange], seriescolor = "deepskyblue", legend = false)
  plot!(Lrange, appx_chromasphere.(Lrange), seriescolor = "brown1")
end
